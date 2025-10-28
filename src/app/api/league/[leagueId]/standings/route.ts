import { NextRequest, NextResponse } from 'next/server';
import { getLeagueStandings } from '@/lib/actions/league';

/**
 * GET /api/league/[leagueId]/standings
 * Get league standings
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { leagueId: string } }
) {
    try {
        const leagueId = Number(params.leagueId);
        
        if (isNaN(leagueId)) {
            return NextResponse.json(
                { error: 'Invalid league ID' },
                { status: 400 }
            );
        }
        
        const standings = await getLeagueStandings(leagueId);
        
        return NextResponse.json(standings);
    } catch (error) {
        console.error('Error fetching standings:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch standings' },
            { status: 500 }
        );
    }
}

