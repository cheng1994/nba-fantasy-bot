import { sql } from 'drizzle-orm'
import { 
    integer, 
    varchar, 
    timestamp, 
    pgTable, 
    serial,
    text,
    unique
} from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

// Player Wishlist table - allows users to mark players they prefer in the draft
// Wishlist players get a boost in draft recommendations
export const playerWishlist = pgTable('player_wishlist', {
    id: serial('id').primaryKey(),
    owner: text('owner').notNull(), // Stack Auth user ID (user.id)
    playerId: varchar('player_id', { length: 20 }).notNull(), // References nbaStats.playerId
    season: integer('season').notNull(), // Season for which this wishlist applies
    priority: integer('priority').default(1), // Optional priority ranking (1 = highest)
    notes: text('notes'), // Optional notes about why they want this player
    
    // Metadata
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
    return {
        // A user can only wishlist a player once per season
        uniqueOwnerPlayerSeason: unique('unique_owner_player_season').on(
            table.owner, 
            table.playerId, 
            table.season
        ),
    }
})

// Schemas for selecting
export const selectPlayerWishlistSchema = createSelectSchema(playerWishlist)

// Types
export type PlayerWishlist = typeof playerWishlist.$inferSelect
export type NewPlayerWishlist = typeof playerWishlist.$inferInsert

// Schema for adding a player to wishlist
export const addToWishlistSchema = z.object({
    owner: z.string().min(1), // Stack Auth user ID
    playerId: z.string().min(1),
    season: z.number().int().min(2020).max(2030),
    priority: z.number().int().min(1).max(10).default(1),
    notes: z.string().max(500).optional(),
})

// Schema for removing from wishlist
export const removeFromWishlistSchema = z.object({
    owner: z.string().min(1),
    playerId: z.string().min(1),
    season: z.number().int().min(2020).max(2030),
})

// Schema for getting wishlist items
export const getWishlistSchema = z.object({
    owner: z.string().min(1),
    season: z.number().int().min(2020).max(2030),
})

// Schema for updating wishlist priority
export const updateWishlistPrioritySchema = z.object({
    id: z.number().int().positive(),
    priority: z.number().int().min(1).max(10),
    notes: z.string().max(500).optional(),
})

export type AddToWishlistParams = z.infer<typeof addToWishlistSchema>
export type RemoveFromWishlistParams = z.infer<typeof removeFromWishlistSchema>
export type GetWishlistParams = z.infer<typeof getWishlistSchema>
export type UpdateWishlistPriorityParams = z.infer<typeof updateWishlistPrioritySchema>

