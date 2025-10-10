'use server';

import { db } from '@/lib/db';
import { 
    nbaStats, 
    FilterNbaStatsParams, 
    filterNbaStatsSchema,
    NbaStats 
} from '@/lib/db/schema/nba-stats';
import { eq, desc, asc, and, sql } from 'drizzle-orm';

/**
 * Fetch NBA stats with optional filters
 */
export const fetchNbaStats = async (
    filters?: FilterNbaStatsParams
): Promise<NbaStats[]> => {
    try {
        // Parse and validate filters
        const validatedFilters = filterNbaStatsSchema.parse(filters || {});
        
        // Build where conditions
        const conditions = [];
        
        if (validatedFilters.season !== undefined) {
            conditions.push(eq(nbaStats.season, validatedFilters.season));
        }
        
        if (validatedFilters.team !== undefined) {
            conditions.push(eq(nbaStats.team, validatedFilters.team));
        }
        
        if (validatedFilters.position !== undefined) {
            conditions.push(eq(nbaStats.position, validatedFilters.position));
        }
        
        if (validatedFilters.drafted !== undefined) {
            conditions.push(eq(nbaStats.drafted, validatedFilters.drafted));
        }
        
        // Determine order by column
        let orderByColumn;
        switch (validatedFilters.orderBy) {
            case 'fpts':
                orderByColumn = nbaStats.fpts;
                break;
            case 'points':
                orderByColumn = nbaStats.points;
                break;
            case 'assists':
                orderByColumn = nbaStats.assists;
                break;
            case 'rebounds':
                orderByColumn = nbaStats.totalRebounds;
                break;
            case 'player':
                orderByColumn = nbaStats.player;
                break;
            case 'fpts_total':
            default:
                orderByColumn = nbaStats.fptsTotal;
                break;
        }
        
        // Build query
        let query = db
            .select()
            .from(nbaStats);
        
        // Apply where conditions if any
        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }
        
        // Apply ordering
        query = query.orderBy(
            validatedFilters.orderDirection === 'asc' 
                ? asc(orderByColumn) 
                : desc(orderByColumn)
        ) as any;
        
        // Apply pagination
        query = query
            .limit(validatedFilters.limit)
            .offset(validatedFilters.offset) as any;
        
        const results = await query;
        return results;
        
    } catch (error) {
        console.error('Error fetching NBA stats:', error);
        throw new Error('Failed to fetch NBA stats');
    }
};

/**
 * Fetch a single player's stats by player ID
 */
export const fetchPlayerStats = async (
    playerId: string,
    season?: number
): Promise<NbaStats | null> => {
    try {
        const conditions = [eq(nbaStats.playerId, playerId)];
        
        if (season !== undefined) {
            conditions.push(eq(nbaStats.season, season));
        }
        
        const [result] = await db
            .select()
            .from(nbaStats)
            .where(and(...conditions))
            .limit(1);
        
        return result || null;
        
    } catch (error) {
        console.error('Error fetching player stats:', error);
        throw new Error('Failed to fetch player stats');
    }
};

/**
 * Get all unique teams from nba_stats
 */
export const fetchTeams = async (season?: number): Promise<string[]> => {
    try {
        const conditions = season !== undefined 
            ? [eq(nbaStats.season, season)]
            : [];
        
        let query = db
            .selectDistinct({ team: nbaStats.team })
            .from(nbaStats);
        
        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }
        
        const results = await query;
        return results
            .map(r => r.team)
            .filter((team): team is string => team !== null)
            .sort();
        
    } catch (error) {
        console.error('Error fetching teams:', error);
        throw new Error('Failed to fetch teams');
    }
};

/**
 * Get all unique positions from nba_stats
 */
export const fetchPositions = async (): Promise<string[]> => {
    try {
        const results = await db
            .selectDistinct({ position: nbaStats.position })
            .from(nbaStats);
        
        return results
            .map(r => r.position)
            .filter((position): position is string => position !== null)
            .sort();
        
    } catch (error) {
        console.error('Error fetching positions:', error);
        throw new Error('Failed to fetch positions');
    }
};

/**
 * Search players by name
 */
export const searchPlayers = async (
    searchTerm: string,
    limit = 20
): Promise<NbaStats[]> => {
    try {
        const results = await db
            .select()
            .from(nbaStats)
            .where(sql`${nbaStats.player} ILIKE ${`%${searchTerm}%`}`)
            .orderBy(desc(nbaStats.fptsTotal))
            .limit(limit);
        
        return results;
        
    } catch (error) {
        console.error('Error searching players:', error);
        throw new Error('Failed to search players');
    }
};

/**
 * Update a player's draft status
 */
export const updateNbaStats = async (id: number, drafted: boolean): Promise<NbaStats> => {
    const [result] = await db
        .update(nbaStats)
        .set({ drafted })
        .where(eq(nbaStats.id, id))
        .returning();
    return result;
};