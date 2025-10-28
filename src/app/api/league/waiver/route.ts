import { NextRequest, NextResponse } from 'next/server';
import { addWaiverClaim } from '@/lib/actions/league';

/**
 * POST /api/league/waiver
 * Add waiver claim
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        const transaction = await addWaiverClaim(body);
        
        return NextResponse.json(transaction);
    } catch (error) {
        console.error('Error adding waiver claim:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to add waiver claim' },
            { status: 500 }
        );
    }
}

