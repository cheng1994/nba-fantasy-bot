import { NextRequest, NextResponse } from 'next/server';
import { proposeTrade, acceptTrade, getPendingTrades } from '@/lib/actions/league';
import { stackServerApp } from '@/stack/server'
/**
 * POST /api/league/trade
 * Propose a trade
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
        
        if (body.action === 'accept') {
            // Accept trade
            const { tradeId, acceptingTeamId } = body;
            
            const trade = await acceptTrade(tradeId, acceptingTeamId);
            
            return NextResponse.json(trade);
        }
        
        // Propose trade
        const trade = await proposeTrade(body);
        
        return NextResponse.json(trade);
    } catch (error) {
        console.error('Error processing trade:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process trade' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/league/trade?teamId=X
 * Get pending trades for a team
 */
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const teamId = searchParams.get('teamId');
        
        if (!teamId) {
            return NextResponse.json(
                { error: 'teamId is required' },
                { status: 400 }
            );
        }
        
        const trades = await getPendingTrades(Number(teamId));
        
        return NextResponse.json(trades);
    } catch (error) {
        console.error('Error fetching trades:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch trades' },
            { status: 500 }
        );
    }
}

