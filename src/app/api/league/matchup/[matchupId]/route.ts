import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyMatchup } from '@/lib/actions/league';

/**
 * GET /api/league/matchup/[matchupId]
 * Get matchup details with lineups
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { matchupId: string } }
) {
    try {
        const matchupId = Number(params.matchupId);
        
        if (isNaN(matchupId)) {
            return NextResponse.json(
                { error: 'Invalid matchup ID' },
                { status: 400 }
            );
        }
        
        const matchup = await getWeeklyMatchup(matchupId);
        
        if (!matchup) {
            return NextResponse.json(
                { error: 'Matchup not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(matchup);
    } catch (error) {
        console.error('Error fetching matchup:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch matchup' },
            { status: 500 }
        );
    }
}

