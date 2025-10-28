import { NextRequest, NextResponse } from 'next/server';
import {
    createLeague,
    getLeague,
    joinLeague,
    getLeagueStandings,
    getUserLeagues,
} from '@/lib/actions/league';
import { stackServerApp } from '@/stack/server'
/**
 * POST /api/league
 * Create a new league
 */
export async function POST(req: NextRequest) {
    try {
       
        // Authenticate user
        const user = await stackServerApp.getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
        const userId = user.id;
        const body = await req.json();
        const { name, season, leagueType, maxTeams, lineupLockTime, waiverType } = body;
        
        const league = await createLeague({
            name,
            commissionerId: userId,
            season,
            leagueType,
            maxTeams,
            lineupLockTime,
            waiverType,
        });
        
        return NextResponse.json(league);
    } catch (error) {
        console.error('Error creating league:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create league' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/league?leagueId=X
 * Get league details
 */
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const leagueId = searchParams.get('leagueId');
        const userId = searchParams.get('userId');
        const season = searchParams.get('season');
        
        if (leagueId) {
            const league = await getLeague(Number(leagueId));
            
            if (!league) {
                return NextResponse.json(
                    { error: 'League not found' },
                    { status: 404 }
                );
            }
            
            return NextResponse.json(league);
        }
        
        if (userId) {
            const leagues = await getUserLeagues(
                userId,
                season ? Number(season) : undefined
            );
            return NextResponse.json(leagues);
        }
        
        return NextResponse.json(
            { error: 'Either leagueId or userId must be provided' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error fetching league:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch league' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/league/join
 * Join a league with a team
 */
export async function PUT(req: NextRequest) {
    try {
        // Authenticate user
        const user = await stackServerApp.getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
        const userId = user.id;
        
        const body = await req.json();
        const { leagueId, teamId, draftPosition } = body;
        
        const membership = await joinLeague({
            leagueId,
            teamId,
            draftPosition,
        });
        
        return NextResponse.json(membership);
    } catch (error) {
        console.error('Error joining league:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to join league' },
            { status: 500 }
        );
    }
}

