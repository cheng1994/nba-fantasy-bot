import { tool } from 'ai';
import { z } from 'zod';
import { 
    getFantasyTeam, 
    getFantasyTeamsByOwner,
    getAvailablePlayers,
    validateRosterPositions
} from './fantasy-teams';

/**
 * Tool for querying user fantasy teams in chat interface
 * Use this to get information about a user's fantasy team roster to provide recommendations
 */
export const getFantasyTeamTool = tool({
    description: `Get a user's fantasy team roster with full player details including stats.
    Use this to analyze the current team composition, positions, and player performance
    to provide personalized recommendations and insights.`,
    inputSchema: z.object({
        teamId: z.number().int().positive().describe('The fantasy team ID to retrieve'),
    }),
    execute: async ({ teamId }) => {
        const team = await getFantasyTeam(teamId);
        
        if (!team) {
            return { error: 'Team not found' };
        }
        
        return {
            team: {
                id: team.id,
                name: team.name,
                owner: team.owner,
                season: team.season,
                createdAt: team.createdAt,
                updatedAt: team.updatedAt,
            },
            roster: team.roster.map(player => ({
                rosterId: player.id,
                playerId: player.playerId,
                playerName: player.playerName,
                team: player.playerTeam,
                age: player.playerAge,
                designatedPosition: player.designatedPosition,
                eligiblePositions: player.eligiblePositions,
                rosterOrder: player.rosterOrder,
                projectedFpts: player.projectedFpts,
                fpts: player.fpts,
                fptsTotal: player.fptsTotal,
                addedAt: player.addedAt,
            })),
            rosterCount: team.roster.length,
            maxRosterSize: 13,
            availableSpots: 13 - team.roster.length,
        };
    },
});

/**
 * Tool for listing all fantasy teams for a user
 * Use this to find which teams a user owns
 */
export const listUserFantasyTeamsTool = tool({
    description: `Get all fantasy teams owned by a user. Use this to find a user's team IDs
    when you need to analyze their rosters. Can optionally filter by season.`,
    inputSchema: z.object({
        owner: z.string().describe('The owner ID (Stack Auth user ID)'),
        season: z.number().int().optional().describe('Optional: filter by season (e.g., 2025)'),
    }),
    execute: async ({ owner, season }) => {
        const teams = await getFantasyTeamsByOwner(owner, season);
        
        return teams.map(team => ({
            id: team.id,
            name: team.name,
            owner: team.owner,
            season: team.season,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
        }));
    },
});

/**
 * Tool for getting available players for a team
 * Use this to suggest potential draft picks or roster additions
 */
export const getAvailablePlayersTool = tool({
    description: `Get available players that are not currently on a specific team's roster.
    Use this to suggest potential draft picks, waiver wire pickups, or roster additions.
    Returns players sorted by total fantasy points.`,
    inputSchema: z.object({
        teamId: z.number().int().positive().describe('The fantasy team ID'),
        season: z.number().int().describe('The season to get players from (e.g., 2025)'),
        limit: z.number().int().min(1).max(500).default(50).describe('Number of results to return'),
    }),
    execute: async ({ teamId, season, limit }) => {
        const players = await getAvailablePlayers(teamId, season, limit);
        
        return players.map(player => ({
            id: player.id,
            playerId: player.playerId,
            player: player.player,
            team: player.team,
            position: player.position,
            age: player.age,
            season: player.season,
            games: player.games,
            projectedFpts: player.projectedFpts,
            fpts: player.fpts,
            fptsTotal: player.fptsTotal,
            points: player.points,
            assists: player.assists,
            totalRebounds: player.totalRebounds,
            steals: player.steals,
            blocks: player.blocks,
            turnovers: player.turnovers,
            x3pMade: player.x3pMade,
            fgPercentage: player.fgPercentage,
            ftPercentage: player.ftPercentage,
        }));
    },
});

/**
 * Tool for validating roster positions
 * Use this to check if a team has all required positions filled
 */
export const validateRosterTool = tool({
    description: `Validate a fantasy team's roster to check if all required positions are filled.
    Use this to identify gaps in the roster or suggest position-specific pickups.
    Required positions: PG, SG, SF, PF, C, G. Full roster is 13 players.`,
    inputSchema: z.object({
        teamId: z.number().int().positive().describe('The fantasy team ID to validate'),
    }),
    execute: async ({ teamId }) => {
        const validation = await validateRosterPositions(teamId);
        
        return {
            isValid: validation.isValid,
            missingPositions: validation.missingPositions,
            rosterCount: validation.rosterCount,
            hasFullRoster: validation.hasFullRoster,
            maxRosterSize: 13,
            requiredPositions: ['PG', 'SG', 'SF', 'PF', 'C', 'G'],
        };
    },
});

