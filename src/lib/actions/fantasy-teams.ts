'use server';

import { db } from '@/lib/db';
import { 
    fantasyTeams,
    teamRosters,
    FantasyTeam,
    TeamRoster,
    CreateFantasyTeamParams,
    createFantasyTeamSchema,
    AddPlayerToRosterParams,
    addPlayerToRosterSchema,
    UpdateRosterSpotParams,
    updateRosterSpotSchema,
} from '@/lib/db/schema/fantasy-teams';
import { nbaStats } from '@/lib/db/schema/nba-stats';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Create a new fantasy team
 */
export const createFantasyTeam = async (
    params: CreateFantasyTeamParams
): Promise<FantasyTeam> => {
    try {
        const validatedParams = createFantasyTeamSchema.parse(params);
        
        const [team] = await db
            .insert(fantasyTeams)
            .values(validatedParams)
            .returning();
        
        return team;
    } catch (error) {
        console.error('Error creating fantasy team:', error);
        throw new Error('Failed to create fantasy team');
    }
};

/**
 * Get a fantasy team by ID with full roster details
 */
export const getFantasyTeam = async (teamId: number) => {
    try {
        const [team] = await db
            .select()
            .from(fantasyTeams)
            .where(eq(fantasyTeams.id, teamId))
            .limit(1);
        
        if (!team) {
            return null;
        }
        
        // Get roster with player details
        const roster = await db
            .select({
                id: teamRosters.id,
                teamId: teamRosters.teamId,
                playerId: teamRosters.playerId,
                designatedPosition: teamRosters.designatedPosition,
                eligiblePositions: teamRosters.eligiblePositions,
                rosterOrder: teamRosters.rosterOrder,
                addedAt: teamRosters.addedAt,
                // Player details from nba_stats
                playerName: nbaStats.player,
                playerTeam: nbaStats.team,
                playerAge: nbaStats.age,
                fptsTotal: nbaStats.fptsTotal,
                fpts: nbaStats.fpts,
                projectedFpts: nbaStats.projectedFpts,

            })
            .from(teamRosters)
            .leftJoin(nbaStats, eq(teamRosters.playerId, nbaStats.playerId))
            .where(eq(teamRosters.teamId, teamId))
            .orderBy(teamRosters.rosterOrder);
        
        return {
            ...team,
            roster,
        };
    } catch (error) {
        console.error('Error fetching fantasy team:', error);
        throw new Error('Failed to fetch fantasy team');
    }
};

/**
 * Get all fantasy teams for an owner
 */
export const getFantasyTeamsByOwner = async (
    owner: string,
    season?: number
): Promise<FantasyTeam[]> => {
    try {
        const conditions = [eq(fantasyTeams.owner, owner)];
        
        if (season !== undefined) {
            conditions.push(eq(fantasyTeams.season, season));
        }
        
        const teams = await db
            .select()
            .from(fantasyTeams)
            .where(and(...conditions));
        
        return teams;
    } catch (error) {
        console.error('Error fetching fantasy teams by owner:', error);
        throw new Error('Failed to fetch fantasy teams');
    }
};

/**
 * Add a player to a team roster
 */
export const addPlayerToRoster = async (
    params: AddPlayerToRosterParams
): Promise<TeamRoster> => {
    try {
        const validatedParams = addPlayerToRosterSchema.parse(params);
        
        // Check if team has space (max 13 players)
        const rosterCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(teamRosters)
            .where(eq(teamRosters.teamId, validatedParams.teamId));
        
        if (Number(rosterCount[0].count) >= 13) {
            throw new Error('Team roster is full (maximum 13 players)');
        }
        
        // Check if player is already on the team
        const existingPlayer = await db
            .select()
            .from(teamRosters)
            .where(
                and(
                    eq(teamRosters.teamId, validatedParams.teamId),
                    eq(teamRosters.playerId, validatedParams.playerId)
                )
            )
            .limit(1);
        
        if (existingPlayer.length > 0) {
            throw new Error('Player is already on this team');
        }
        
        const [rosterSpot] = await db
            .insert(teamRosters)
            .values(validatedParams)
            .returning();
        
        return rosterSpot;
    } catch (error) {
        console.error('Error adding player to roster:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to add player to roster');
    }
};

/**
 * Remove a player from a team roster
 */
export const removePlayerFromRoster = async (
    rosterSpotId: number
): Promise<void> => {
    try {
        await db
            .delete(teamRosters)
            .where(eq(teamRosters.id, rosterSpotId));
    } catch (error) {
        console.error('Error removing player from roster:', error);
        throw new Error('Failed to remove player from roster');
    }
};

/**
 * Update a roster spot (e.g., change designated position or roster order)
 */
export const updateRosterSpot = async (
    params: UpdateRosterSpotParams
): Promise<TeamRoster> => {
    try {
        const validatedParams = updateRosterSpotSchema.parse(params);
        const { id, ...updates } = validatedParams;
        
        const [updatedSpot] = await db
            .update(teamRosters)
            .set(updates)
            .where(eq(teamRosters.id, id))
            .returning();
        
        if (!updatedSpot) {
            throw new Error('Roster spot not found');
        }
        
        return updatedSpot;
    } catch (error) {
        console.error('Error updating roster spot:', error);
        throw new Error('Failed to update roster spot');
    }
};

/**
 * Get roster for a team
 */
export const getTeamRoster = async (teamId: number): Promise<TeamRoster[]> => {
    try {
        const roster = await db
            .select()
            .from(teamRosters)
            .where(eq(teamRosters.teamId, teamId))
            .orderBy(teamRosters.rosterOrder);
        
        return roster;
    } catch (error) {
        console.error('Error fetching team roster:', error);
        throw new Error('Failed to fetch team roster');
    }
};

/**
 * Delete a fantasy team and all its roster entries
 */
export const deleteFantasyTeam = async (teamId: number): Promise<void> => {
    try {
        // Cascade delete will automatically remove roster entries
        await db
            .delete(fantasyTeams)
            .where(eq(fantasyTeams.id, teamId));
    } catch (error) {
        console.error('Error deleting fantasy team:', error);
        throw new Error('Failed to delete fantasy team');
    }
};

/**
 * Get available players (not on a specific team) with filtering
 */
export const getAvailablePlayers = async (
    teamId: number,
    season: number,
    limit = 100
) => {
    try {
        // Get players already on the team
        const rosterPlayerIds = await db
            .select({ playerId: teamRosters.playerId })
            .from(teamRosters)
            .where(eq(teamRosters.teamId, teamId));
        
        const playerIds = rosterPlayerIds.map(r => r.playerId);
        
        // Get all players for the season, excluding those on the team
        let whereConditions = [eq(nbaStats.season, season)];
        
        if (playerIds.length > 0) {
            whereConditions.push(
                sql`${nbaStats.playerId} NOT IN (${sql.join(playerIds.map(id => sql`${id}`), sql`, `)})`
            );
        }
        
        const results = await db
            .select()
            .from(nbaStats)
            .where(and(...whereConditions))
            .orderBy(sql`${nbaStats.fptsTotal} DESC NULLS LAST`)
            .limit(limit);
        
        return results;
    } catch (error) {
        console.error('Error fetching available players:', error);
        throw new Error('Failed to fetch available players');
    }
};

/**
 * Validate roster positions (ensure all required positions are filled)
 */
export const validateRosterPositions = async (teamId: number) => {
    try {
        const roster = await getTeamRoster(teamId);
        
        const requiredPositions = ['PG', 'SG', 'SF', 'PF', 'C', 'G'];
        const filledPositions = new Set(
            roster
                .filter(r => requiredPositions.includes(r.designatedPosition))
                .map(r => r.designatedPosition)
        );
        
        const missingPositions = requiredPositions.filter(
            pos => !filledPositions.has(pos)
        );
        
        return {
            isValid: missingPositions.length === 0,
            missingPositions,
            rosterCount: roster.length,
            hasFullRoster: roster.length === 13,
        };
    } catch (error) {
        console.error('Error validating roster positions:', error);
        throw new Error('Failed to validate roster positions');
    }
};

