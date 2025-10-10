import { sql } from 'drizzle-orm'
import { 
    integer, 
    varchar, 
    decimal, 
    timestamp, 
    pgTable, 
    serial,
    boolean 
} from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const nbaStats = pgTable('nba_stats', {
    id: serial('id').primaryKey(),
    season: integer('season').notNull(),
    league: varchar('league', { length: 10 }).notNull(),
    player: varchar('player', { length: 100 }).notNull(),
    playerId: varchar('player_id', { length: 20 }).notNull(),
    age: integer('age'),
    team: varchar('team', { length: 10 }),
    position: varchar('position', { length: 5 }),
    
    // Fantasy Points
    fptsTotal: decimal('fpts_total', { precision: 10, scale: 2 }),
    fpts: decimal('fpts', { precision: 10, scale: 2 }),
    
    // Games
    games: integer('games'),
    gamesStarted: integer('games_started'),
    minutesPlayed: integer('minutes_played'),
    
    // Field Goals
    fgMade: integer('fg_made'),
    fgAttempted: integer('fg_attempted'),
    fgPercentage: decimal('fg_percentage', { precision: 5, scale: 3 }),
    
    // 3-Point Field Goals
    x3pMade: integer('x3p_made'),
    x3pAttempted: integer('x3p_attempted'),
    x3pPercentage: decimal('x3p_percentage', { precision: 5, scale: 3 }),
    
    // 2-Point Field Goals
    x2pMade: integer('x2p_made'),
    x2pAttempted: integer('x2p_attempted'),
    x2pPercentage: decimal('x2p_percentage', { precision: 5, scale: 3 }),
    
    // Effective Field Goal Percentage
    eFgPercentage: decimal('e_fg_percentage', { precision: 5, scale: 3 }),
    
    // Free Throws
    ftMade: integer('ft_made'),
    ftAttempted: integer('ft_attempted'),
    ftPercentage: decimal('ft_percentage', { precision: 5, scale: 3 }),
    
    // Rebounds
    offensiveRebounds: integer('offensive_rebounds'),
    defensiveRebounds: integer('defensive_rebounds'),
    totalRebounds: integer('total_rebounds'),
    
    // Other Stats
    assists: integer('assists'),
    steals: integer('steals'),
    blocks: integer('blocks'),
    turnovers: integer('turnovers'),
    personalFouls: integer('personal_fouls'),
    points: integer('points'),
    tripleDoubles: integer('triple_doubles'),
    
    // Draft Status
    drafted: boolean('drafted').default(false),
    
    // Metadata
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
})

// Schema for selecting nba stats
export const selectNbaStatsSchema = createSelectSchema(nbaStats)

// Type for nba stats
export type NbaStats = typeof nbaStats.$inferSelect
export type NewNbaStats = typeof nbaStats.$inferInsert

// Schema for filtering nba stats with optional filters
export const filterNbaStatsSchema = z.object({
    season: z.number().optional(),
    team: z.string().optional(),
    position: z.string().optional(),
    drafted: z.boolean().optional(),
    limit: z.number().min(1).max(500).default(100),
    offset: z.number().min(0).default(0),
    orderBy: z.enum(['fpts_total', 'fpts', 'points', 'assists', 'rebounds', 'player']).default('fpts_total'),
    orderDirection: z.enum(['asc', 'desc']).default('desc'),
})

export type FilterNbaStatsParams = z.infer<typeof filterNbaStatsSchema>

