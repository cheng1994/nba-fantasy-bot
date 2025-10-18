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
import { nbaStats } from './nba-stats'

// Fantasy Teams table - represents a user's fantasy team
export const fantasyTeams = pgTable('fantasy_teams', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    owner: text('owner').notNull(), // Stack Auth user ID (user.id)
    season: integer('season').notNull(),
    
    // Metadata
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
    return {
        // One team per owner per season
        uniqueOwnerSeason: unique('unique_owner_season').on(table.owner, table.season),
    }
})

// Valid positions for fantasy roster
export const validPositions = ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL', 'BENCH'] as const
export type Position = typeof validPositions[number]

// Team Rosters table - represents the 13 players on a fantasy team
// Each team needs 1 player for each position: PG, SG, SF, PF, C, G
// Plus additional roster spots (F, UTIL, or BENCH)
export const teamRosters = pgTable('team_rosters', {
    id: serial('id').primaryKey(),
    teamId: integer('team_id')
        .notNull()
        .references(() => fantasyTeams.id, { onDelete: 'cascade' }),
    playerId: varchar('player_id', { length: 20 }).notNull(), // References nbaStats.playerId
    
    // Designated position on the fantasy team (where they're slotted)
    designatedPosition: varchar('designated_position', { length: 10 }).notNull(), // PG, SG, SF, PF, C, G, F, UTIL, or BENCH
    
    // Player's eligible positions (can be multiple, stored as comma-separated: "PG,SG" or "SF,PF")
    eligiblePositions: text('eligible_positions').notNull(),
    
    // Order in roster display
    rosterOrder: integer('roster_order').notNull().default(0),
    
    // Metadata
    addedAt: timestamp('added_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
    return {
        // A player can only be on a team once
        uniqueTeamPlayer: unique('unique_team_player').on(table.teamId, table.playerId),
    }
})

// Schemas for selecting
export const selectFantasyTeamSchema = createSelectSchema(fantasyTeams)
export const selectTeamRosterSchema = createSelectSchema(teamRosters)

// Types
export type FantasyTeam = typeof fantasyTeams.$inferSelect
export type NewFantasyTeam = typeof fantasyTeams.$inferInsert
export type TeamRoster = typeof teamRosters.$inferSelect
export type NewTeamRoster = typeof teamRosters.$inferInsert

// Schema for creating a fantasy team
export const createFantasyTeamSchema = z.object({
    name: z.string().min(1).max(100),
    owner: z.string().min(1), // Stack Auth user ID
    season: z.number().int().min(2020).max(2030),
})

// Schema for adding a player to a team roster
export const addPlayerToRosterSchema = z.object({
    teamId: z.number().int().positive(),
    playerId: z.string().min(1),
    designatedPosition: z.enum(validPositions),
    eligiblePositions: z.string().min(1), // e.g., "PG,SG" or "C"
    rosterOrder: z.number().int().min(0).default(0),
})

// Schema for updating a roster spot
export const updateRosterSpotSchema = z.object({
    id: z.number().int().positive(),
    designatedPosition: z.enum(validPositions).optional(),
    rosterOrder: z.number().int().min(0).optional(),
})

export type CreateFantasyTeamParams = z.infer<typeof createFantasyTeamSchema>
export type AddPlayerToRosterParams = z.infer<typeof addPlayerToRosterSchema>
export type UpdateRosterSpotParams = z.infer<typeof updateRosterSpotSchema>

