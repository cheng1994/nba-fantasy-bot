import { NextRequest, NextResponse } from 'next/server'
import { 
    addToWishlist, 
    removeFromWishlist, 
    getWishlist, 
    updateWishlistPriority,
    isPlayerWishlisted
} from '@/lib/actions/wishlist'
import { stackServerApp } from '@/stack/server'

// GET /api/wishlist?season=2025
export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const user = await stackServerApp.getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const season = searchParams.get('season')
        const playerId = searchParams.get('playerId')

        // Check if specific player is wishlisted
        if (playerId && season) {
            const result = await isPlayerWishlisted(
                user.id,
                playerId,
                parseInt(season)
            )
            return NextResponse.json(result)
        }

        // Get full wishlist
        if (!season) {
            return NextResponse.json(
                { error: 'Season parameter is required' },
                { status: 400 }
            )
        }

        const result = await getWishlist({
            owner: user.id,
            season: parseInt(season),
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        })
    } catch (error) {
        console.error('GET /api/wishlist error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/wishlist - Add player to wishlist
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const user = await stackServerApp.getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { playerId, season, priority, notes } = body

        if (!playerId || !season) {
            return NextResponse.json(
                { error: 'playerId and season are required' },
                { status: 400 }
            )
        }

        const result = await addToWishlist({
            owner: user.id,
            playerId,
            season: parseInt(season),
            priority: priority || 1,
            notes: notes || undefined,
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        })
    } catch (error) {
        console.error('POST /api/wishlist error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PATCH /api/wishlist - Update wishlist item priority/notes
export async function PATCH(request: NextRequest) {
    try {
        // Authenticate user
        const user = await stackServerApp.getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { id, priority, notes } = body

        if (!id || !priority) {
            return NextResponse.json(
                { error: 'id and priority are required' },
                { status: 400 }
            )
        }

        const result = await updateWishlistPriority({
            id: parseInt(id),
            priority: parseInt(priority),
            notes: notes || undefined,
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        })
    } catch (error) {
        console.error('PATCH /api/wishlist error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/wishlist?id=123
export async function DELETE(request: NextRequest) {
    try {
        // Authenticate user
        const user = await stackServerApp.getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'id parameter is required' },
                { status: 400 }
            )
        }

        const result = await removeFromWishlist({
            id: parseInt(id),
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
        })
    } catch (error) {
        console.error('DELETE /api/wishlist error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

