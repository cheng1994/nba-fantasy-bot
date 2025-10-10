'use server';

import { tool } from 'ai';
import { z } from 'zod';
import { fetchNbaStats, searchPlayers } from './nba-stats';

/**
 * Tool for querying NBA stats in chat interface
 */
export const queryNBAStatsTool = tool({
    description: `Query NBA player statistics from the database. 
    Use this to get player stats, filter by team, position, or draft status,
    search for players by name, or get top players by various metrics.`,
    inputSchema: z.object({
        // Search by player name
        search: z.string().optional().describe('Search for players by name'),
        
        // Filter parameters
        season: z.number().optional().describe('Filter by season (e.g., 2025)'),
        team: z.string().optional().describe('Filter by team abbreviation (e.g., LAL, GSW)'),
        position: z.string().optional().describe('Filter by position: PG, SG, SF, PF, or C'),
        drafted: z.boolean().optional().describe('Filter by draft status (true = drafted, false = available)'),
        
        // Pagination
        limit: z.number().min(1).max(500).default(20).describe('Number of results to return'),
        offset: z.number().min(0).default(0).describe('Offset for pagination'),
        
        // Sorting
        orderBy: z.enum(['fpts_total', 'fpts', 'points', 'assists', 'rebounds', 'player'])
            .default('fpts_total')
            .describe('Column to sort by'),
        orderDirection: z.enum(['asc', 'desc'])
            .default('desc')
            .describe('Sort direction'),
    }),
    execute: async ({ search, season, team, position, drafted, limit, offset, orderBy, orderDirection }) => {
        // If search term is provided, use search
        if (search) {
            const results = await searchPlayers(search, limit);
            return results.map(player => ({
                id: player.id,
                player: player.player,
                playerId: player.playerId,
                team: player.team,
                position: player.position,
                age: player.age,
                season: player.season,
                games: player.games,
                fpts: player.fpts,
                fptsTotal: player.fptsTotal,
                points: player.points,
                assists: player.assists,
                rebounds: player.totalRebounds,
                steals: player.steals,
                blocks: player.blocks,
                drafted: player.drafted,
            }));
        }
        
        // Otherwise use filter-based query
        const results = await fetchNbaStats({
            season,
            team,
            position,
            drafted,
            limit,
            offset,
            orderBy,
            orderDirection,
        });
        
        return results.map(player => ({
            id: player.id,
            player: player.player,
            playerId: player.playerId,
            team: player.team,
            position: player.position,
            age: player.age,
            season: player.season,
            games: player.games,
            fpts: player.fpts,
            fptsTotal: player.fptsTotal,
            points: player.points,
            assists: player.assists,
            rebounds: player.totalRebounds,
            steals: player.steals,
            blocks: player.blocks,
            turnovers: player.turnovers,
            fgPercentage: player.fgPercentage,
            x3pMade: player.x3pMade,
            x3pPercentage: player.x3pPercentage,
            ftPercentage: player.ftPercentage,
            tripleDoubles: player.tripleDoubles,
            drafted: player.drafted,
        }));
    },
});

