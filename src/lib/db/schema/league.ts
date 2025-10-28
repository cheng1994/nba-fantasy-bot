import { sql } from 'drizzle-orm'
import {
    integer,
    varchar,
    timestamp,
    pgTable,
    serial,
    text,
    decimal,
    boolean,
    jsonb,
    unique,
} from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fantasyTeams } from './fantasy-teams'

// ============================================
// 1. LEAGUES TABLE
// ============================================
export const leagues = pgTable('leagues', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    commissionerId: text('commissioner_id').notNull(),
    season: integer('season').notNull(),
    
    // League settings
    leagueType: varchar('league_type', { length: 20 }).notNull().default('h2h_points'),
    maxTeams: integer('max_teams').notNull().default(12),
    rosterSize: integer('roster_size').notNull().default(13),
    playoffTeams: integer('playoff_teams').notNull().default(6),
    playoffStartWeek: integer('playoff_start_week').notNull().default(18),
    
    // Lock-in feature settings
    lineupLockTime: varchar('lineup_lock_time', { length: 20 }).notNull().default('game_time'),
    waiverType: varchar('waiver_type', { length: 20 }).notNull().default('faab'),
    tradeDeadlineWeek: integer('trade_deadline_week'),
    
    // League status
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    draftDate: timestamp('draft_date'),
    
    // Metadata
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
})

// ============================================
// 2. LEAGUE_MEMBERSHIPS TABLE
// ============================================
export const leagueMemberships = pgTable('league_memberships', {
    id: serial('id').primaryKey(),
    leagueId: integer('league_id')
        .notNull()
        .references(() => leagues.id, { onDelete: 'cascade' }),
    teamId: integer('team_id')
        .notNull()
        .references(() => fantasyTeams.id, { onDelete: 'cascade' }),
    
    // Draft and waivers
    draftPosition: integer('draft_position'),
    waiverPriority: integer('waiver_priority'),
    faabBudget: integer('faab_budget').notNull().default(100),
    
    // Standings
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    ties: integer('ties').notNull().default(0),
    pointsFor: decimal('points_for', { precision: 10, scale: 2 }).notNull().default('0.00'),
    pointsAgainst: decimal('points_against', { precision: 10, scale: 2 }).notNull().default('0.00'),
    
    // Metadata
    joinedAt: timestamp('joined_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
    return {
        uniqueLeagueTeam: unique('unique_league_team').on(table.leagueId, table.teamId),
    }
})

// ============================================
// 3. SCORING_SETTINGS TABLE
// ============================================
export const scoringSettings = pgTable('scoring_settings', {
    id: serial('id').primaryKey(),
    leagueId: integer('league_id')
        .notNull()
        .references(() => leagues.id, { onDelete: 'cascade' }),
    
    // Points per stat
    ptsPerPoint: decimal('pts_per_point', { precision: 5, scale: 2 }).notNull().default('1.00'),
    ptsPerRebound: decimal('pts_per_rebound', { precision: 5, scale: 2 }).notNull().default('1.20'),
    ptsPerAssist: decimal('pts_per_assist', { precision: 5, scale: 2 }).notNull().default('1.50'),
    ptsPerSteal: decimal('pts_per_steal', { precision: 5, scale: 2 }).notNull().default('3.00'),
    ptsPerBlock: decimal('pts_per_block', { precision: 5, scale: 2 }).notNull().default('3.00'),
    ptsPerTurnover: decimal('pts_per_turnover', { precision: 5, scale: 2 }).notNull().default('-1.00'),
    
    // Bonus scoring
    ptsPer3pm: decimal('pts_per_3pm', { precision: 5, scale: 2 }).notNull().default('0.50'),
    ptsPerDoubleDouble: decimal('pts_per_double_double', { precision: 5, scale: 2 }).notNull().default('1.50'),
    ptsPerTripleDouble: decimal('pts_per_triple_double', { precision: 5, scale: 2 }).notNull().default('3.00'),
    
    // Field goal penalties
    ptsPerFgMade: decimal('pts_per_fg_made', { precision: 5, scale: 2 }).notNull().default('0.00'),
    ptsPerFgMissed: decimal('pts_per_fg_missed', { precision: 5, scale: 2 }).notNull().default('-0.50'),
    ptsPerFtMade: decimal('pts_per_ft_made', { precision: 5, scale: 2 }).notNull().default('0.00'),
    ptsPerFtMissed: decimal('pts_per_ft_missed', { precision: 5, scale: 2 }).notNull().default('-0.50'),
    
    // Metadata
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
    return {
        uniqueLeagueScoring: unique('unique_league_scoring').on(table.leagueId),
    }
})

// ============================================
// 4. WEEKLY_MATCHUPS TABLE
// ============================================
export const weeklyMatchups = pgTable('weekly_matchups', {
    id: serial('id').primaryKey(),
    leagueId: integer('league_id')
        .notNull()
        .references(() => leagues.id, { onDelete: 'cascade' }),
    weekNumber: integer('week_number').notNull(),
    season: integer('season').notNull(),
    
    // Competing teams
    team1Id: integer('team1_id')
        .references(() => leagueMemberships.id, { onDelete: 'set null' }),
    team2Id: integer('team2_id')
        .references(() => leagueMemberships.id, { onDelete: 'set null' }),
    
    // Results
    team1Score: decimal('team1_score', { precision: 10, scale: 2 }),
    team2Score: decimal('team2_score', { precision: 10, scale: 2 }),
    winnerId: integer('winner_id')
        .references(() => leagueMemberships.id, { onDelete: 'set null' }),
    
    // Matchup metadata
    isPlayoffMatchup: boolean('is_playoff_matchup').notNull().default(false),
    lockedAt: timestamp('locked_at'),
    status: varchar('status', { length: 20 }).notNull().default('upcoming'),
    
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
    return {
        uniqueLeagueWeekTeam1: unique('unique_league_week_team1').on(table.leagueId, table.weekNumber, table.team1Id),
    }
})

// ============================================
// 5. WEEKLY_LINEUPS TABLE
// ============================================
export const weeklyLineups = pgTable('weekly_lineups', {
    id: serial('id').primaryKey(),
    matchupId: integer('matchup_id')
        .notNull()
        .references(() => weeklyMatchups.id, { onDelete: 'cascade' }),
    teamId: integer('team_id')
        .notNull()
        .references(() => leagueMemberships.id, { onDelete: 'cascade' }),
    weekNumber: integer('week_number').notNull(),
    
    // Starting lineup (9 active players)
    pgPlayerId: varchar('pg_player_id', { length: 20 }),
    sgPlayerId: varchar('sg_player_id', { length: 20 }),
    sfPlayerId: varchar('sf_player_id', { length: 20 }),
    pfPlayerId: varchar('pf_player_id', { length: 20 }),
    cPlayerId: varchar('c_player_id', { length: 20 }),
    gPlayerId: varchar('g_player_id', { length: 20 }),
    fPlayerId: varchar('f_player_id', { length: 20 }),
    util1PlayerId: varchar('util1_player_id', { length: 20 }),
    util2PlayerId: varchar('util2_player_id', { length: 20 }),
    
    // Bench players (JSON array)
    benchPlayerIds: jsonb('bench_player_ids').notNull().default(sql`'[]'::jsonb`),
    
    // Scoring and lock status
    totalPoints: decimal('total_points', { precision: 10, scale: 2 }),
    isLocked: boolean('is_locked').notNull().default(false),
    lockedAt: timestamp('locked_at'),
    
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
    return {
        uniqueMatchupTeam: unique('unique_matchup_team').on(table.matchupId, table.teamId),
    }
})

// ============================================
// 6. PLAYER_WEEKLY_STATS TABLE
// ============================================
export const playerWeeklyStats = pgTable('player_weekly_stats', {
    id: serial('id').primaryKey(),
    playerId: varchar('player_id', { length: 20 }).notNull(),
    weekNumber: integer('week_number').notNull(),
    season: integer('season').notNull(),
    
    // Aggregated stats
    gamesPlayed: integer('games_played').notNull().default(0),
    minutesPlayed: integer('minutes_played').notNull().default(0),
    points: integer('points').notNull().default(0),
    rebounds: integer('rebounds').notNull().default(0),
    assists: integer('assists').notNull().default(0),
    steals: integer('steals').notNull().default(0),
    blocks: integer('blocks').notNull().default(0),
    turnovers: integer('turnovers').notNull().default(0),
    
    // Field goals
    fgMade: integer('fg_made').notNull().default(0),
    fgAttempted: integer('fg_attempted').notNull().default(0),
    fgPercentage: decimal('fg_percentage', { precision: 5, scale: 3 }),
    
    // 3-pointers
    threePm: integer('three_pm').notNull().default(0),
    threePa: integer('three_pa').notNull().default(0),
    threePPercentage: decimal('three_p_percentage', { precision: 5, scale: 3 }),
    
    // Free throws
    ftMade: integer('ft_made').notNull().default(0),
    ftAttempted: integer('ft_attempted').notNull().default(0),
    ftPercentage: decimal('ft_percentage', { precision: 5, scale: 3 }),
    
    // Fantasy scoring
    fantasyPoints: decimal('fantasy_points', { precision: 10, scale: 2 }),
    
    // Game logs (JSON array)
    gameLogs: jsonb('game_logs').notNull().default(sql`'[]'::jsonb`),
    
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
    return {
        uniquePlayerWeekSeason: unique('unique_player_week_season').on(table.playerId, table.weekNumber, table.season),
    }
})

// ============================================
// 7. TRADES TABLE
// ============================================
export const trades = pgTable('trades', {
    id: serial('id').primaryKey(),
    leagueId: integer('league_id')
        .notNull()
        .references(() => leagues.id, { onDelete: 'cascade' }),
    season: integer('season').notNull(),
    
    // Teams involved
    team1Id: integer('team1_id')
        .notNull()
        .references(() => leagueMemberships.id, { onDelete: 'cascade' }),
    team2Id: integer('team2_id')
        .notNull()
        .references(() => leagueMemberships.id, { onDelete: 'cascade' }),
    
    // Players being traded (JSON arrays)
    team1Players: jsonb('team1_players').notNull(),
    team2Players: jsonb('team2_players').notNull(),
    
    // Trade status
    status: varchar('status', { length: 20 }).notNull().default('proposed'),
    proposedBy: integer('proposed_by')
        .notNull()
        .references(() => leagueMemberships.id, { onDelete: 'cascade' }),
    
    // Timestamps
    proposedAt: timestamp('proposed_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    respondedAt: timestamp('responded_at'),
    processedAt: timestamp('processed_at'),
    
    // Review system
    vetoVotes: integer('veto_votes').notNull().default(0),
    reviewDeadline: timestamp('review_deadline'),
    
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
})

// ============================================
// 8. WAIVER_TRANSACTIONS TABLE
// ============================================
export const waiverTransactions = pgTable('waiver_transactions', {
    id: serial('id').primaryKey(),
    leagueId: integer('league_id')
        .notNull()
        .references(() => leagues.id, { onDelete: 'cascade' }),
    teamId: integer('team_id')
        .notNull()
        .references(() => leagueMemberships.id, { onDelete: 'cascade' }),
    weekNumber: integer('week_number').notNull(),
    
    // Transaction details
    actionType: varchar('action_type', { length: 20 }).notNull(),
    playerAddedId: varchar('player_added_id', { length: 20 }),
    playerDroppedId: varchar('player_dropped_id', { length: 20 }),
    
    // Waiver specifics
    waiverPriority: integer('waiver_priority'),
    faabBid: integer('faab_bid').notNull().default(0),
    
    // Status
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    processedAt: timestamp('processed_at'),
    
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
})

// ============================================
// 9. DRAFT_PICKS TABLE
// ============================================
export const draftPicks = pgTable('draft_picks', {
    id: serial('id').primaryKey(),
    leagueId: integer('league_id')
        .notNull()
        .references(() => leagues.id, { onDelete: 'cascade' }),
    season: integer('season').notNull(),
    
    // Pick details
    pickNumber: integer('pick_number').notNull(),
    round: integer('round').notNull(),
    pickInRound: integer('pick_in_round').notNull(),
    
    // Team and player
    teamId: integer('team_id')
        .notNull()
        .references(() => leagueMemberships.id, { onDelete: 'cascade' }),
    playerId: varchar('player_id', { length: 20 }).notNull(),
    
    // Trade support
    originalTeamId: integer('original_team_id')
        .references(() => leagueMemberships.id, { onDelete: 'set null' }),
    isKeeperPick: boolean('is_keeper_pick').notNull().default(false),
    
    // Metadata
    pickedAt: timestamp('picked_at'),
    
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
    return {
        uniqueLeaguePick: unique('unique_league_pick').on(table.leagueId, table.season, table.pickNumber),
    }
})

// ============================================
// 10. LEAGUE_MESSAGES TABLE
// ============================================
export const leagueMessages = pgTable('league_messages', {
    id: serial('id').primaryKey(),
    leagueId: integer('league_id')
        .notNull()
        .references(() => leagues.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    
    messageType: varchar('message_type', { length: 20 }).notNull().default('general'),
    content: text('content').notNull(),
    
    // Thread support
    parentMessageId: integer('parent_message_id')
        .references((): any => leagueMessages.id, { onDelete: 'cascade' }),
    
    // Reactions (JSON)
    reactions: jsonb('reactions').notNull().default(sql`'{}'::jsonb`),
    
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
})

// ============================================
// 11. LEAGUE_SETTINGS TABLE
// ============================================
export const leagueSettings = pgTable('league_settings', {
    id: serial('id').primaryKey(),
    leagueId: integer('league_id')
        .notNull()
        .references(() => leagues.id, { onDelete: 'cascade' }),
    
    // Roster settings
    maxGamesPerWeek: integer('max_games_per_week'),
    irSpots: integer('ir_spots').notNull().default(0),
    taxiSquadSpots: integer('taxi_squad_spots').notNull().default(0),
    
    // Trade settings
    tradeReviewPeriodHours: integer('trade_review_period_hours').notNull().default(24),
    tradesAllowed: boolean('trades_allowed').notNull().default(true),
    allowBenchTrades: boolean('allow_bench_trades').notNull().default(false),
    
    // Waiver settings
    waiverPeriodDays: integer('waiver_period_days').notNull().default(2),
    waiverClearDays: text('waiver_clear_days'),
    
    // Playoff settings
    playoffFormat: varchar('playoff_format', { length: 20 }).notNull().default('standard'),
    playoffWeeks: integer('playoff_weeks').notNull().default(3),
    consolationBracket: boolean('consolation_bracket').notNull().default(true),
    
    // Metadata
    createdAt: timestamp('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
    return {
        uniqueLeagueSettings: unique('unique_league_settings').on(table.leagueId),
    }
})

// ============================================
// TYPES
// ============================================
export type League = typeof leagues.$inferSelect
export type NewLeague = typeof leagues.$inferInsert

export type LeagueMembership = typeof leagueMemberships.$inferSelect
export type NewLeagueMembership = typeof leagueMemberships.$inferInsert

export type ScoringSettings = typeof scoringSettings.$inferSelect
export type NewScoringSettings = typeof scoringSettings.$inferInsert

export type WeeklyMatchup = typeof weeklyMatchups.$inferSelect
export type NewWeeklyMatchup = typeof weeklyMatchups.$inferInsert

export type WeeklyLineup = typeof weeklyLineups.$inferSelect
export type NewWeeklyLineup = typeof weeklyLineups.$inferInsert

export type PlayerWeeklyStats = typeof playerWeeklyStats.$inferSelect
export type NewPlayerWeeklyStats = typeof playerWeeklyStats.$inferInsert

export type Trade = typeof trades.$inferSelect
export type NewTrade = typeof trades.$inferInsert

export type WaiverTransaction = typeof waiverTransactions.$inferSelect
export type NewWaiverTransaction = typeof waiverTransactions.$inferInsert

export type DraftPick = typeof draftPicks.$inferSelect
export type NewDraftPick = typeof draftPicks.$inferInsert

export type LeagueMessage = typeof leagueMessages.$inferSelect
export type NewLeagueMessage = typeof leagueMessages.$inferInsert

export type LeagueSettings = typeof leagueSettings.$inferSelect
export type NewLeagueSettings = typeof leagueSettings.$inferInsert

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

// League creation schema
export const createLeagueSchema = z.object({
    name: z.string().min(1).max(100),
    commissionerId: z.string().min(1),
    season: z.number().int().min(2020).max(2030),
    leagueType: z.enum(['h2h_points', 'h2h_category', 'roto']).default('h2h_points'),
    maxTeams: z.number().int().min(6).max(20).default(12),
    lineupLockTime: z.enum(['game_time', 'daily_lock', 'weekly_lock']).default('game_time'),
    waiverType: z.enum(['faab', 'rolling', 'reverse_standings']).default('faab'),
})

// Add team to league
export const joinLeagueSchema = z.object({
    leagueId: z.number().int().positive(),
    teamId: z.number().int().positive(),
    draftPosition: z.number().int().positive().optional(),
})

// Create lineup
export const createLineupSchema = z.object({
    matchupId: z.number().int().positive(),
    teamId: z.number().int().positive(),
    weekNumber: z.number().int().min(1).max(24),
    pgPlayerId: z.string().min(1),
    sgPlayerId: z.string().min(1),
    sfPlayerId: z.string().min(1),
    pfPlayerId: z.string().min(1),
    cPlayerId: z.string().min(1),
    gPlayerId: z.string().min(1),
    fPlayerId: z.string().min(1),
    util1PlayerId: z.string().min(1),
    util2PlayerId: z.string().min(1),
    benchPlayerIds: z.array(z.string()).default([]),
})

// Lock lineup
export const lockLineupSchema = z.object({
    lineupId: z.number().int().positive(),
    userId: z.string().min(1),
})

// Propose trade
export const proposeTradeSchema = z.object({
    leagueId: z.number().int().positive(),
    season: z.number().int().min(2020).max(2030),
    team1Id: z.number().int().positive(),
    team2Id: z.number().int().positive(),
    team1Players: z.array(z.string()).min(1),
    team2Players: z.array(z.string()).min(1),
    proposedBy: z.number().int().positive(),
})

// Waiver claim
export const claimWaiverSchema = z.object({
    leagueId: z.number().int().positive(),
    teamId: z.number().int().positive(),
    weekNumber: z.number().int().min(1).max(24),
    actionType: z.enum(['add', 'drop', 'add_drop']),
    playerAddedId: z.string().optional(),
    playerDroppedId: z.string().optional(),
    faabBid: z.number().int().min(0).default(0),
})

// Export types
export type CreateLeagueParams = z.infer<typeof createLeagueSchema>
export type JoinLeagueParams = z.infer<typeof joinLeagueSchema>
export type CreateLineupParams = z.infer<typeof createLineupSchema>
export type LockLineupParams = z.infer<typeof lockLineupSchema>
export type ProposeTradeParams = z.infer<typeof proposeTradeSchema>
export type ClaimWaiverParams = z.infer<typeof claimWaiverSchema>

