'use server';

import { db } from '@/lib/db';
import {
    leagues,
    leagueMemberships,
    scoringSettings,
    leagueSettings,
    weeklyMatchups,
    weeklyLineups,
    playerWeeklyStats,
    trades,
    waiverTransactions,
    draftPicks,
    leagueMessages,
    League,
    LeagueMembership,
    CreateLeagueParams,
    createLeagueSchema,
    JoinLeagueParams,
    joinLeagueSchema,
    CreateLineupParams,
    createLineupSchema,
    LockLineupParams,
    lockLineupSchema,
    ProposeTradeParams,
    proposeTradeSchema,
    ClaimWaiverParams,
    claimWaiverSchema,
} from '@/lib/db/schema/league';
import { fantasyTeams } from '@/lib/db/schema/fantasy-teams';
import { eq, and, desc, sql, or, inArray } from 'drizzle-orm';

/**
 * Create a new league
 */
export const createLeague = async (params: CreateLeagueParams): Promise<League> => {
    try {
        const validatedParams = createLeagueSchema.parse(params);
        
        const [league] = await db
            .insert(leagues)
            .values(validatedParams)
            .returning();
        
        return league;
    } catch (error) {
        console.error('Error creating league:', error);
        throw new Error('Failed to create league');
    }
};

/**
 * Get a league by ID with full details
 */
export const getLeague = async (leagueId: number) => {
    try {
        const [league] = await db
            .select()
            .from(leagues)
            .where(eq(leagues.id, leagueId))
            .limit(1);
        
        if (!league) {
            return null;
        }
        
        // Get all teams in league
        const teams = await db
            .select({
                membershipId: leagueMemberships.id,
                leagueId: leagueMemberships.leagueId,
                teamId: leagueMemberships.teamId,
                draftPosition: leagueMemberships.draftPosition,
                waiverPriority: leagueMemberships.waiverPriority,
                faabBudget: leagueMemberships.faabBudget,
                wins: leagueMemberships.wins,
                losses: leagueMemberships.losses,
                ties: leagueMemberships.ties,
                pointsFor: leagueMemberships.pointsFor,
                pointsAgainst: leagueMemberships.pointsAgainst,
                team: {
                    id: fantasyTeams.id,
                    name: fantasyTeams.name,
                    owner: fantasyTeams.owner,
                },
            })
            .from(leagueMemberships)
            .innerJoin(fantasyTeams, eq(leagueMemberships.teamId, fantasyTeams.id))
            .where(eq(leagueMemberships.leagueId, leagueId))
            .orderBy(desc(leagueMemberships.wins), leagueMemberships.losses);
        
        // Get scoring settings
        const [scoring] = await db
            .select()
            .from(scoringSettings)
            .where(eq(scoringSettings.leagueId, leagueId))
            .limit(1);
        
        // Get league settings
        const [settings] = await db
            .select()
            .from(leagueSettings)
            .where(eq(leagueSettings.leagueId, leagueId))
            .limit(1);
        
        return {
            ...league,
            teams,
            scoring: scoring || null,
            settings: settings || null,
        };
    } catch (error) {
        console.error('Error fetching league:', error);
        throw new Error('Failed to fetch league');
    }
};

/**
 * Join a league with a team
 */
export const joinLeague = async (params: JoinLeagueParams): Promise<LeagueMembership> => {
    try {
        const validatedParams = joinLeagueSchema.parse(params);
        
        // Check if league is full
        const membershipCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(leagueMemberships)
            .where(eq(leagueMemberships.leagueId, validatedParams.leagueId));
        
        const [league] = await db
            .select()
            .from(leagues)
            .where(eq(leagues.id, validatedParams.leagueId))
            .limit(1);
        
        if (Number(membershipCount[0].count) >= league!.maxTeams) {
            throw new Error('League is full');
        }
        
        // Check if team is already in league
        const existing = await db
            .select()
            .from(leagueMemberships)
            .where(
                and(
                    eq(leagueMemberships.leagueId, validatedParams.leagueId),
                    eq(leagueMemberships.teamId, validatedParams.teamId)
                )
            )
            .limit(1);
        
        if (existing.length > 0) {
            throw new Error('Team is already in this league');
        }
        
        const [membership] = await db
            .insert(leagueMemberships)
            .values(validatedParams)
            .returning();
        
        return membership;
    } catch (error) {
        console.error('Error joining league:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to join league');
    }
};

/**
 * Get standings for a league
 */
export const getLeagueStandings = async (leagueId: number) => {
    try {
        const results = await db
            .select({
                membershipId: leagueMemberships.id,
                team: fantasyTeams,
                wins: leagueMemberships.wins,
                losses: leagueMemberships.losses,
                ties: leagueMemberships.ties,
                pointsFor: leagueMemberships.pointsFor,
                pointsAgainst: leagueMemberships.pointsAgainst,
            })
            .from(leagueMemberships)
            .innerJoin(fantasyTeams, eq(leagueMemberships.teamId, fantasyTeams.id))
            .where(eq(leagueMemberships.leagueId, leagueId))
            .orderBy(desc(leagueMemberships.wins), leagueMemberships.losses);
        
        return results;
    } catch (error) {
        console.error('Error fetching league standings:', error);
        throw new Error('Failed to fetch league standings');
    }
};

/**
 * Get weekly matchup
 */
export const getWeeklyMatchup = async (matchupId: number) => {
    try {
        const [matchup] = await db
            .select()
            .from(weeklyMatchups)
            .where(eq(weeklyMatchups.id, matchupId))
            .limit(1);
        
        if (!matchup) {
            return null;
        }
        
        // Get both teams' lineups
        const lineups = await db
            .select()
            .from(weeklyLineups)
            .where(eq(weeklyLineups.matchupId, matchupId));
        
        const [team1, team2] = await db
            .select({
                membership: leagueMemberships,
                team: fantasyTeams,
            })
            .from(leagueMemberships)
            .innerJoin(fantasyTeams, eq(leagueMemberships.teamId, fantasyTeams.id))
            .where(
                or(
                    eq(leagueMemberships.id, matchup!.team1Id || 0),
                    eq(leagueMemberships.id, matchup!.team2Id || 0)
                )
            );
        
        return {
            ...matchup,
            team1Lineup: lineups.find(l => l.teamId === matchup.team1Id),
            team2Lineup: lineups.find(l => l.teamId === matchup.team2Id),
            team1,
            team2,
        };
    } catch (error) {
        console.error('Error fetching weekly matchup:', error);
        throw new Error('Failed to fetch matchup');
    }
};

/**
 * Set weekly lineup
 */
export const setWeeklyLineup = async (params: CreateLineupParams) => {
    try {
        const validatedParams = createLineupSchema.parse(params);
        
        // Check if lineup already exists
        const existing = await db
            .select()
            .from(weeklyLineups)
            .where(
                and(
                    eq(weeklyLineups.matchupId, validatedParams.matchupId),
                    eq(weeklyLineups.teamId, validatedParams.teamId)
                )
            )
            .limit(1);
        
        if (existing.length > 0) {
            // Update existing lineup
            const [updated] = await db
                .update(weeklyLineups)
                .set(validatedParams)
                .where(eq(weeklyLineups.id, existing[0].id))
                .returning();
            
            return updated;
        }
        
        // Create new lineup
        const [lineup] = await db
            .insert(weeklyLineups)
            .values(validatedParams)
            .returning();
        
        return lineup;
    } catch (error) {
        console.error('Error setting lineup:', error);
        throw new Error('Failed to set lineup');
    }
};

/**
 * Lock a lineup (Sleeper-style lock-in)
 */
export const lockLineup = async (params: LockLineupParams): Promise<boolean> => {
    try {
        const validatedParams = lockLineupSchema.parse(params);
        
        // Check if user can lock this lineup
        const [lineup] = await db
            .select({
                lineup: weeklyLineups,
                membership: leagueMemberships,
                team: fantasyTeams,
            })
            .from(weeklyLineups)
            .innerJoin(leagueMemberships, eq(weeklyLineups.teamId, leagueMemberships.id))
            .innerJoin(fantasyTeams, eq(leagueMemberships.teamId, fantasyTeams.id))
            .where(eq(weeklyLineups.id, validatedParams.lineupId))
            .limit(1);
        
        if (!lineup) {
            throw new Error('Lineup not found');
        }
        
        // Verify user owns this team
        if (lineup.team.owner !== validatedParams.userId) {
            throw new Error('Unauthorized: You do not own this team');
        }
        
        // Check if already locked
        if (lineup.lineup.isLocked) {
            throw new Error('Lineup is already locked');
        }
        
        // Check matchup status
        const [matchup] = await db
            .select()
            .from(weeklyMatchups)
            .where(eq(weeklyMatchups.id, lineup.lineup.matchupId))
            .limit(1);
        
        if (matchup!.status === 'locked' || matchup!.status === 'final') {
            throw new Error('Cannot lock lineup: matchup is locked or finalized');
        }
        
        // Lock the lineup
        await db
            .update(weeklyLineups)
            .set({
                isLocked: true,
                lockedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(weeklyLineups.id, validatedParams.lineupId));
        
        return true;
    } catch (error) {
        console.error('Error locking lineup:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to lock lineup');
    }
};

/**
 * Get team's matchup for a week
 */
export const getTeamMatchup = async (
    leagueId: number,
    teamId: number,
    weekNumber: number
) => {
    try {
        const [membership] = await db
            .select()
            .from(leagueMemberships)
            .where(
                and(
                    eq(leagueMemberships.leagueId, leagueId),
                    eq(leagueMemberships.teamId, teamId)
                )
            )
            .limit(1);
        
        if (!membership) {
            throw new Error('Team not in league');
        }
        
        const [matchup] = await db
            .select()
            .from(weeklyMatchups)
            .where(
                and(
                    eq(weeklyMatchups.leagueId, leagueId),
                    eq(weeklyMatchups.weekNumber, weekNumber),
                    or(
                        eq(weeklyMatchups.team1Id, membership.id),
                        eq(weeklyMatchups.team2Id, membership.id)
                    )
                )
            )
            .limit(1);
        
        return matchup || null;
    } catch (error) {
        console.error('Error fetching team matchup:', error);
        throw new Error('Failed to fetch team matchup');
    }
};

/**
 * Propose a trade
 */
export const proposeTrade = async (params: ProposeTradeParams) => {
    try {
        const validatedParams = proposeTradeSchema.parse(params);
        
        // Verify teams are different
        if (validatedParams.team1Id === validatedParams.team2Id) {
            throw new Error('Cannot trade with yourself');
        }
        
        // Create trade
        const [trade] = await db
            .insert(trades)
            .values({
                ...validatedParams,
                team1Players: validatedParams.team1Players as any,
                team2Players: validatedParams.team2Players as any,
            })
            .returning();
        
        return trade;
    } catch (error) {
        console.error('Error proposing trade:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to propose trade');
    }
};

/**
 * Accept a trade
 */
export const acceptTrade = async (tradeId: number, acceptingTeamId: number) => {
    try {
        const [trade] = await db
            .select()
            .from(trades)
            .where(eq(trades.id, tradeId))
            .limit(1);
        
        if (!trade) {
            throw new Error('Trade not found');
        }
        
        // Verify the accepting team is involved
        if (trade.team1Id !== acceptingTeamId && trade.team2Id !== acceptingTeamId) {
            throw new Error('You are not part of this trade');
        }
        
        // Verify it's not already processed
        if (trade.status !== 'proposed') {
            throw new Error(`Trade is already ${trade.status}`);
        }
        
        // Accept the trade
        const [updated] = await db
            .update(trades)
            .set({
                status: 'accepted',
                respondedAt: sql`CURRENT_TIMESTAMP`,
                processedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(trades.id, tradeId))
            .returning();
        
        return updated;
    } catch (error) {
        console.error('Error accepting trade:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to accept trade');
    }
};

/**
 * Add waiver claim
 */
export const addWaiverClaim = async (params: ClaimWaiverParams) => {
    try {
        const validatedParams = claimWaiverSchema.parse(params);
        
        const [transaction] = await db
            .insert(waiverTransactions)
            .values(validatedParams)
            .returning();
        
        return transaction;
    } catch (error) {
        console.error('Error adding waiver claim:', error);
        throw new Error('Failed to add waiver claim');
    }
};

/**
 * Get pending trades for a team
 */
export const getPendingTrades = async (teamId: number) => {
    try {
        const pendingTrades = await db
            .select()
            .from(trades)
            .where(
                and(
                    or(
                        eq(trades.team1Id, teamId),
                        eq(trades.team2Id, teamId)
                    ),
                    eq(trades.status, 'proposed')
                )
            )
            .orderBy(desc(trades.createdAt));
        
        return pendingTrades;
    } catch (error) {
        console.error('Error fetching pending trades:', error);
        throw new Error('Failed to fetch pending trades');
    }
};

/**
 * Get user's leagues
 */
export const getUserLeagues = async (userId: string, season?: number) => {
    try {
        // Get all teams owned by user
        const userTeams = await db
            .select()
            .from(fantasyTeams)
            .where(
                and(
                    eq(fantasyTeams.owner, userId),
                    season ? eq(fantasyTeams.season, season) : undefined
                )
            );
        
        if (userTeams.length === 0) {
            return [];
        }
        
        const teamIds = userTeams.map(team => team.id);
        
        // Get league memberships for these teams
        const memberships = await db
            .select()
            .from(leagueMemberships)
            .where(inArray(leagueMemberships.teamId, teamIds));
        
        if (memberships.length === 0) {
            return [];
        }
        
        const leagueIds = memberships.map(m => m.leagueId);
        
        // Get league details
        const userLeagues = await db
            .select()
            .from(leagues)
            .where(inArray(leagues.id, leagueIds));
        
        return userLeagues;
    } catch (error) {
        console.error('Error fetching user leagues:', error);
        throw new Error('Failed to fetch user leagues');
    }
};

