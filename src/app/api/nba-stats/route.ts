import { NextRequest, NextResponse } from 'next/server';
import { 
    fetchNbaStats, 
    fetchPlayerStats, 
    fetchTeams, 
    fetchPositions,
    searchPlayers,
    updateNbaStats
} from '@/lib/actions/nba-stats';
import { FilterNbaStatsParams } from '@/lib/db/schema/nba-stats';

export const dynamic = 'force-static';

/**
 * GET /api/nba-stats
 * 
 * Query Parameters:
 * - season: number (optional) - Filter by season
 * - team: string (optional) - Filter by team abbreviation
 * - position: string (optional) - Filter by position (PG, SG, SF, PF, C)
 * - drafted: boolean (optional) - Filter by draft status
 * - limit: number (optional, default: 100, max: 500) - Number of results to return
 * - offset: number (optional, default: 0) - Offset for pagination
 * - orderBy: string (optional, default: 'fpts_total') - Column to order by
 * - orderDirection: 'asc' | 'desc' (optional, default: 'desc') - Sort direction
 * - playerId: string (optional) - Get stats for specific player
 * - search: string (optional) - Search players by name
 * - action: 'teams' | 'positions' (optional) - Get list of teams or positions
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        
        // Handle pspecial actions
        const action = searchParams.get('action');
        
        if (action === 'teams') {
            const season = searchParams.get('season');
            const teams = await fetchTeams(season ? Number.parseInt(season) : undefined);
            return NextResponse.json({ teams });
        }
        
        if (action === 'positions') {
            const positions = await fetchPositions();
            return NextResponse.json({ positions });
        }
        
        // Handle player search
        const search = searchParams.get('search');
        if (search) {
            const limit = searchParams.get('limit');
            const results = await searchPlayers(
                search, 
                limit ? Number.parseInt(limit) : 20
            );
            return NextResponse.json({ 
                data: results,
                count: results.length 
            });
        }
        
        // Handle single player lookup
        const playerId = searchParams.get('playerId');
        if (playerId) {
            const season = searchParams.get('season');
            const player = await fetchPlayerStats(
                playerId,
                season ? Number.parseInt(season) : undefined
            );
            
            if (!player) {
                return NextResponse.json(
                    { error: 'Player not found' },
                    { status: 404 }
                );
            }
            
            return NextResponse.json({ data: player });
        }
        
        // Build filters for general query
        const filters: FilterNbaStatsParams = {
            limit: 100,
            offset: 0,
            orderBy: 'fpts_total',
            orderDirection: 'desc',
            season: undefined,
            team: undefined,
            position: undefined,
            drafted: undefined,
        };
        
        const season = searchParams.get('season');
        if (season) {
            filters.season = Number.parseInt(season);
        }
        
        const team = searchParams.get('team');
        if (team) {
            filters.team = team;
        }
        
        const position = searchParams.get('position');
        if (position) {
            filters.position = position;
        }
        
        const drafted = searchParams.get('drafted');
        if (drafted !== null) {
            filters.drafted = drafted === 'true';
        }
        
        const limit = searchParams.get('limit');
        if (limit) {
            filters.limit = Number.parseInt(limit);
        }
        
        const offset = searchParams.get('offset');
        if (offset) {
            filters.offset = Number.parseInt(offset);
        }
        
        const orderBy = searchParams.get('orderBy');
        if (orderBy) {
            filters.orderBy = orderBy as any;
        }
        
        const orderDirection = searchParams.get('orderDirection');
        if (orderDirection === 'asc' || orderDirection === 'desc') {
            filters.orderDirection = orderDirection;
        }
        
        // Fetch stats
        const stats = await fetchNbaStats(filters);
        
        return NextResponse.json({
            data: stats,
            count: stats.length,
            filters: filters,
        });
        
    } catch (error) {
        console.error('API Error:', error);
        
        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    const { id, drafted } = await request.json();
    const stats = await updateNbaStats(id, drafted);
    return NextResponse.json({ data: stats });
}
