import { NextRequest, NextResponse } from 'next/server';
import { setWeeklyLineup, lockLineup } from '@/lib/actions/league';
import { stackServerApp } from '@/stack/server'

/**
 * POST /api/league/lineup
 * Set or update weekly lineup
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
        const { action } = body;
        
        if (action === 'lock') {
            const { lineupId } = body;
            
            await lockLineup({
                lineupId,
                userId: userId,
            });
            
            return NextResponse.json({ success: true, locked: true });
        }
        
        // Set lineup action
        const lineup = await setWeeklyLineup(body);
        
        return NextResponse.json(lineup);
    } catch (error) {
        console.error('Error setting lineup:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to set lineup' },
            { status: 500 }
        );
    }
}

