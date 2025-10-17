'use server'

import { db } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { 
    playerWishlist,
    type AddToWishlistParams,
    type RemoveFromWishlistParams,
    type GetWishlistParams,
    type UpdateWishlistPriorityParams,
    addToWishlistSchema,
    removeFromWishlistSchema,
    getWishlistSchema,
    updateWishlistPrioritySchema,
} from '@/lib/db/schema/wishlist'
import { nbaStats } from '@/lib/db/schema/nba-stats'

/**
 * Add a player to a user's wishlist
 * @param params - AddToWishlistParams with owner, playerId, season, priority, and optional notes
 * @returns The created wishlist item or error
 */
export async function addToWishlist(params: AddToWishlistParams) {
    try {
        // Validate input
        const validated = addToWishlistSchema.parse(params)
        
        // Check if player exists
        const player = await db.query.nbaStats.findFirst({
            where: and(
                eq(nbaStats.playerId, validated.playerId),
                eq(nbaStats.season, validated.season)
            ),
        })
        
        if (!player) {
            return { 
                error: 'Player not found for the specified season',
                success: false 
            }
        }
        
        // Add to wishlist
        const [wishlistItem] = await db.insert(playerWishlist)
            .values({
                owner: validated.owner,
                playerId: validated.playerId,
                season: validated.season,
                priority: validated.priority,
                notes: validated.notes,
            })
            .returning()
        
        return { 
            success: true, 
            data: wishlistItem 
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error)
        if (error instanceof Error && error.message.includes('unique_owner_player_season')) {
            return { 
                error: 'Player is already on your wishlist',
                success: false 
            }
        }
        return { 
            error: error instanceof Error ? error.message : 'Failed to add to wishlist',
            success: false 
        }
    }
}

/**
 * Remove a player from a user's wishlist
 * @param params - RemoveFromWishlistParams with wishlist item id
 * @returns Success status
 */
export async function removeFromWishlist(params: RemoveFromWishlistParams) {
    try {
        const validated = removeFromWishlistSchema.parse(params)
        
        await db.delete(playerWishlist)
            .where(eq(playerWishlist.id, validated.id))
        
        return { success: true }
    } catch (error) {
        console.error('Error removing from wishlist:', error)
        return { 
            error: error instanceof Error ? error.message : 'Failed to remove from wishlist',
            success: false 
        }
    }
}

/**
 * Get a user's wishlist with player details
 * @param params - GetWishlistParams with owner and season
 * @returns Array of wishlist items with player details
 */
export async function getWishlist(params: GetWishlistParams) {
    try {
        const validated = getWishlistSchema.parse(params)
        
        const wishlistItems = await db
            .select({
                id: playerWishlist.id,
                owner: playerWishlist.owner,
                playerId: playerWishlist.playerId,
                season: playerWishlist.season,
                priority: playerWishlist.priority,
                notes: playerWishlist.notes,
                createdAt: playerWishlist.createdAt,
                updatedAt: playerWishlist.updatedAt,
                // Player details
                playerName: nbaStats.player,
                team: nbaStats.team,
                position: nbaStats.position,
                age: nbaStats.age,
                projectedFpts: nbaStats.projectedFpts,
                fpts: nbaStats.fpts,
                fptsTotal: nbaStats.fptsTotal,
                points: nbaStats.points,
                assists: nbaStats.assists,
                totalRebounds: nbaStats.totalRebounds,
                steals: nbaStats.steals,
                blocks: nbaStats.blocks,
                drafted: nbaStats.drafted,
            })
            .from(playerWishlist)
            .innerJoin(
                nbaStats,
                and(
                    eq(playerWishlist.playerId, nbaStats.playerId),
                    eq(playerWishlist.season, nbaStats.season)
                )
            )
            .where(
                and(
                    eq(playerWishlist.owner, validated.owner),
                    eq(playerWishlist.season, validated.season)
                )
            )
            .orderBy(playerWishlist.priority, desc(nbaStats.projectedFpts))
        
        return { 
            success: true, 
            data: wishlistItems 
        }
    } catch (error) {
        console.error('Error getting wishlist:', error)
        return { 
            error: error instanceof Error ? error.message : 'Failed to get wishlist',
            success: false,
            data: []
        }
    }
}

/**
 * Update wishlist item priority and/or notes
 * @param params - UpdateWishlistPriorityParams with id, priority, and optional notes
 * @returns Updated wishlist item
 */
export async function updateWishlistPriority(params: UpdateWishlistPriorityParams) {
    try {
        const validated = updateWishlistPrioritySchema.parse(params)
        
        const updateData: { priority: number; notes?: string } = {
            priority: validated.priority,
        }
        
        if (validated.notes !== undefined) {
            updateData.notes = validated.notes
        }
        
        const [updated] = await db.update(playerWishlist)
            .set(updateData)
            .where(eq(playerWishlist.id, validated.id))
            .returning()
        
        return { 
            success: true, 
            data: updated 
        }
    } catch (error) {
        console.error('Error updating wishlist priority:', error)
        return { 
            error: error instanceof Error ? error.message : 'Failed to update wishlist priority',
            success: false 
        }
    }
}

/**
 * Check if a player is on a user's wishlist
 * @param owner - Stack Auth user ID
 * @param playerId - Player ID to check
 * @param season - Season to check
 * @returns Boolean indicating if player is wishlisted
 */
export async function isPlayerWishlisted(owner: string, playerId: string, season: number) {
    try {
        const item = await db.query.playerWishlist.findFirst({
            where: and(
                eq(playerWishlist.owner, owner),
                eq(playerWishlist.playerId, playerId),
                eq(playerWishlist.season, season)
            ),
        })
        
        return { 
            success: true, 
            isWishlisted: !!item,
            priority: item?.priority 
        }
    } catch (error) {
        console.error('Error checking wishlist status:', error)
        return { 
            success: false,
            isWishlisted: false 
        }
    }
}

/**
 * Get wishlist player IDs for a user (for quick lookups in rankings)
 * @param owner - Stack Auth user ID
 * @param season - Season
 * @returns Array of player IDs on wishlist with their priorities
 */
export async function getWishlistPlayerIds(owner: string, season: number) {
    try {
        const items = await db
            .select({
                playerId: playerWishlist.playerId,
                priority: playerWishlist.priority,
            })
            .from(playerWishlist)
            .where(
                and(
                    eq(playerWishlist.owner, owner),
                    eq(playerWishlist.season, season)
                )
            )
        
        return { 
            success: true, 
            data: items 
        }
    } catch (error) {
        console.error('Error getting wishlist player IDs:', error)
        return { 
            success: false,
            data: [] 
        }
    }
}

