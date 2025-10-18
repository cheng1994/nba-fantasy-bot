import { tool } from 'ai';
import { z } from 'zod';
import { 
    getWishlist,
    getWishlistPlayerIds,
    isPlayerWishlisted
} from './wishlist';

/**
 * Tool for getting a user's wishlist in the chat interface
 * Use this to retrieve wishlist players when making draft recommendations
 */
export const getWishlistTool = tool({
    description: `Get a user's wishlist of preferred players with full player details.
    Use this to identify which players the user prefers when making draft recommendations.
    Wishlist players should be highlighted and boosted in rankings.`,
    inputSchema: z.object({
        owner: z.string().describe('The owner ID (Stack Auth user ID)'),
        season: z.number().int().describe('The season (e.g., 2025)'),
    }),
    execute: async ({ owner, season }) => {
        const result = await getWishlist({ owner, season });
        
        if (!result.success) {
            return { 
                error: result.error || 'Failed to retrieve wishlist',
                wishlistItems: []
            };
        }
        
        return {
            wishlistItems: result.data.map(item => ({
                wishlistId: item.id,
                playerId: item.playerId,
                playerName: item.playerName,
                team: item.team,
                position: item.position,
                age: item.age,
                priority: item.priority,
                notes: item.notes,
                projectedFpts: item.projectedFpts,
                fpts: item.fpts,
                fptsTotal: item.fptsTotal,
                points: item.points,
                assists: item.assists,
                totalRebounds: item.totalRebounds,
                steals: item.steals,
                blocks: item.blocks,
                drafted: item.drafted,
                createdAt: item.createdAt,
            })),
            totalWishlistPlayers: result.data.length,
        };
    },
});

/**
 * Tool for getting just the player IDs on a user's wishlist
 * Use this for quick lookups when ranking players
 */
export const getWishlistPlayerIdsTool = tool({
    description: `Get just the player IDs on a user's wishlist with their priority levels.
    Use this for quick lookups when you need to check if players are wishlisted during ranking.
    Priority 1 = highest priority (should get biggest ranking boost).`,
    inputSchema: z.object({
        owner: z.string().describe('The owner ID (Stack Auth user ID)'),
        season: z.number().int().describe('The season (e.g., 2025)'),
    }),
    execute: async ({ owner, season }) => {
        const result = await getWishlistPlayerIds(owner, season);
        
        if (!result.success) {
            return { 
                error: 'Failed to retrieve wishlist player IDs',
                wishlistPlayerIds: []
            };
        }
        
        return {
            wishlistPlayerIds: result.data.map(item => ({
                playerId: item.playerId,
                priority: item.priority,
            })),
        };
    },
});

/**
 * Tool for checking if a specific player is wishlisted
 * Use this when analyzing individual players
 */
export const checkPlayerWishlistStatusTool = tool({
    description: `Check if a specific player is on a user's wishlist.
    Returns whether the player is wishlisted and their priority level if they are.`,
    inputSchema: z.object({
        owner: z.string().describe('The owner ID (Stack Auth user ID)'),
        playerId: z.string().describe('The player ID to check'),
        season: z.number().int().describe('The season (e.g., 2025)'),
    }),
    execute: async ({ owner, playerId, season }) => {
        const result = await isPlayerWishlisted(owner, playerId, season);
        
        return {
            isWishlisted: result.isWishlisted,
            priority: result.priority || null,
        };
    },
});

