-- Create League tables for H2H Fantasy Basketball
-- These tables support head-to-head matchups with Sleeper-style lock-in features

-- ============================================
-- 1. LEAGUES TABLE
-- ============================================
-- Core league management and configuration
CREATE TABLE IF NOT EXISTS leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    commissioner_id TEXT NOT NULL, -- Stack Auth user ID
    season INTEGER NOT NULL,
    
    -- League settings
    league_type VARCHAR(20) NOT NULL DEFAULT 'h2h_points', -- 'h2h_points', 'h2h_category', 'roto'
    max_teams INTEGER NOT NULL DEFAULT 12 CHECK (max_teams BETWEEN 6 AND 20),
    roster_size INTEGER NOT NULL DEFAULT 13,
    playoff_teams INTEGER NOT NULL DEFAULT 6,
    playoff_start_week INTEGER NOT NULL DEFAULT 18,
    
    -- Lock-in feature settings
    lineup_lock_time VARCHAR(20) NOT NULL DEFAULT 'game_time', -- 'game_time', 'daily_lock', 'weekly_lock'
    waiver_type VARCHAR(20) NOT NULL DEFAULT 'faab', -- 'faab', 'rolling', 'reverse_standings'
    trade_deadline_week INTEGER,
    
    -- League status
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'playoffs', 'completed'
    draft_date TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- 2. LEAGUE_MEMBERSHIPS TABLE
-- ============================================
-- Tracks team participation in leagues
CREATE TABLE IF NOT EXISTS league_memberships (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    
    -- Draft and waivers
    draft_position INTEGER,
    waiver_priority INTEGER,
    faab_budget INTEGER DEFAULT 100, -- Starting FAAB budget (usually $100)
    
    -- Standings
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    points_for DECIMAL(10, 2) DEFAULT 0.00,
    points_against DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Metadata
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Unique constraint: one team per league
    CONSTRAINT unique_league_team UNIQUE (league_id, team_id)
);

-- ============================================
-- 3. SCORING_SETTINGS TABLE
-- ============================================
-- Customizable scoring rules for leagues
CREATE TABLE IF NOT EXISTS scoring_settings (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    
    -- Points per stat
    pts_per_point DECIMAL(5, 2) DEFAULT 1.00,
    pts_per_rebound DECIMAL(5, 2) DEFAULT 1.20,
    pts_per_assist DECIMAL(5, 2) DEFAULT 1.50,
    pts_per_steal DECIMAL(5, 2) DEFAULT 3.00,
    pts_per_block DECIMAL(5, 2) DEFAULT 3.00,
    pts_per_turnover DECIMAL(5, 2) DEFAULT -1.00,
    
    -- Bonus scoring
    pts_per_3pm DECIMAL(5, 2) DEFAULT 0.50,
    pts_per_double_double DECIMAL(5, 2) DEFAULT 1.50,
    pts_per_triple_double DECIMAL(5, 2) DEFAULT 3.00,
    
    -- Field goal penalties (negative values)
    pts_per_fg_made DECIMAL(5, 2) DEFAULT 0.00,
    pts_per_fg_missed DECIMAL(5, 2) DEFAULT -0.50,
    pts_per_ft_made DECIMAL(5, 2) DEFAULT 0.00,
    pts_per_ft_missed DECIMAL(5, 2) DEFAULT -0.50,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- One scoring setting per league
    CONSTRAINT unique_league_scoring UNIQUE (league_id)
);

-- ============================================
-- 4. WEEKLY_MATCHUPS TABLE
-- ============================================
-- H2H weekly matchups between teams
CREATE TABLE IF NOT EXISTS weekly_matchups (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 24),
    season INTEGER NOT NULL,
    
    -- Competing teams (can be NULL during playoff bye weeks)
    team1_id INTEGER REFERENCES league_memberships(id) ON DELETE SET NULL,
    team2_id INTEGER REFERENCES league_memberships(id) ON DELETE SET NULL,
    
    -- Results (filled in as week progresses)
    team1_score DECIMAL(10, 2),
    team2_score DECIMAL(10, 2),
    winner_id INTEGER REFERENCES league_memberships(id) ON DELETE SET NULL,
    
    -- Matchup metadata
    is_playoff_matchup BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'locked', 'in_progress', 'final'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- One matchup per team per week per league
    CONSTRAINT unique_league_week_team1 UNIQUE (league_id, week_number, team1_id)
);

-- ============================================
-- 5. WEEKLY_LINEUPS TABLE
-- ============================================
-- Sleeper-style locked lineups for each matchup
CREATE TABLE IF NOT EXISTS weekly_lineups (
    id SERIAL PRIMARY KEY,
    matchup_id INTEGER NOT NULL REFERENCES weekly_matchups(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES league_memberships(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    
    -- Starting lineup (9 active players)
    pg_player_id VARCHAR(20), -- FK to nba_stats.player_id
    sg_player_id VARCHAR(20),
    sf_player_id VARCHAR(20),
    pf_player_id VARCHAR(20),
    c_player_id VARCHAR(20),
    g_player_id VARCHAR(20), -- Flex guard
    f_player_id VARCHAR(20), -- Flex forward
    util1_player_id VARCHAR(20), -- Utility 1
    util2_player_id VARCHAR(20), -- Utility 2
    
    -- Bench players (stored as JSON array)
    bench_player_ids JSONB DEFAULT '[]'::jsonb,
    
    -- Scoring and lock status
    total_points DECIMAL(10, 2),
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- One lineup per team per matchup
    CONSTRAINT unique_matchup_team UNIQUE (matchup_id, team_id)
);

-- ============================================
-- 6. PLAYER_WEEKLY_STATS TABLE
-- ============================================
-- Aggregated player stats for each week
CREATE TABLE IF NOT EXISTS player_weekly_stats (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 24),
    season INTEGER NOT NULL,
    
    -- Aggregated stats for the week
    games_played INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    rebounds INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    
    -- Field goals
    fg_made INTEGER DEFAULT 0,
    fg_attempted INTEGER DEFAULT 0,
    fg_percentage DECIMAL(5, 3),
    
    -- 3-pointers
    three_pm INTEGER DEFAULT 0,
    three_pa INTEGER DEFAULT 0,
    three_p_percentage DECIMAL(5, 3),
    
    -- Free throws
    ft_made INTEGER DEFAULT 0,
    ft_attempted INTEGER DEFAULT 0,
    ft_percentage DECIMAL(5, 3),
    
    -- Fantasy scoring (based on default scoring)
    fantasy_points DECIMAL(10, 2),
    
    -- Game-by-game tracking (optional)
    game_logs JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- One entry per player per week per season
    CONSTRAINT unique_player_week_season UNIQUE (player_id, week_number, season)
);

-- ============================================
-- 7. TRADES TABLE
-- ============================================
-- Player trades between teams
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    
    -- Teams involved
    team1_id INTEGER NOT NULL REFERENCES league_memberships(id) ON DELETE CASCADE,
    team2_id INTEGER NOT NULL REFERENCES league_memberships(id) ON DELETE CASCADE,
    
    -- Players being traded (JSON arrays)
    team1_players JSONB NOT NULL, -- Array of player_ids
    team2_players JSONB NOT NULL, -- Array of player_ids
    
    -- Trade status
    status VARCHAR(20) NOT NULL DEFAULT 'proposed', -- 'proposed', 'accepted', 'rejected', 'vetoed', 'completed'
    proposed_by INTEGER NOT NULL REFERENCES league_memberships(id) ON DELETE CASCADE,
    
    -- Timestamps
    proposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    responded_at TIMESTAMP,
    processed_at TIMESTAMP,
    
    -- Review system
    veto_votes INTEGER DEFAULT 0,
    review_deadline TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CHECK (team1_id != team2_id)
);

-- ============================================
-- 8. WAIVER_TRANSACTIONS TABLE
-- ============================================
-- Free agent pickups and drops
CREATE TABLE IF NOT EXISTS waiver_transactions (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES league_memberships(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    
    -- Transaction details
    action_type VARCHAR(20) NOT NULL, -- 'add', 'drop', 'add_drop'
    player_added_id VARCHAR(20), -- FK to nba_stats.player_id (nullable)
    player_dropped_id VARCHAR(20), -- FK to nba_stats.player_id (nullable)
    
    -- Waiver specifics
    waiver_priority INTEGER,
    faab_bid INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'successful', 'failed', 'cancelled'
    processed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CHECK ((player_added_id IS NOT NULL) OR (player_dropped_id IS NOT NULL))
);

-- ============================================
-- 9. DRAFT_PICKS TABLE
-- ============================================
-- Draft history and picks
CREATE TABLE IF NOT EXISTS draft_picks (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    
    -- Pick details
    pick_number INTEGER NOT NULL, -- Overall pick (1, 2, 3, ...)
    round INTEGER NOT NULL, -- Round number
    pick_in_round INTEGER NOT NULL, -- Pick within round
    
    -- Team and player
    team_id INTEGER NOT NULL REFERENCES league_memberships(id) ON DELETE CASCADE,
    player_id VARCHAR(20) NOT NULL,
    
    -- Trade support
    original_team_id INTEGER REFERENCES league_memberships(id) ON DELETE SET NULL,
    is_keeper_pick BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    picked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- One pick per number per league per season
    CONSTRAINT unique_league_pick UNIQUE (league_id, season, pick_number)
);

-- ============================================
-- 10. LEAGUE_MESSAGES TABLE
-- ============================================
-- League chat and communication
CREATE TABLE IF NOT EXISTS league_messages (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Stack Auth user ID
    
    message_type VARCHAR(20) NOT NULL DEFAULT 'general', -- 'general', 'trade_talk', 'trash_talk', 'announcement'
    content TEXT NOT NULL,
    
    -- Thread support
    parent_message_id INTEGER REFERENCES league_messages(id) ON DELETE CASCADE,
    
    -- Reactions (optional JSON)
    reactions JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- 11. LEAGUE_SETTINGS TABLE
-- ============================================
-- Extended league configuration
CREATE TABLE IF NOT EXISTS league_settings (
    id SERIAL PRIMARY KEY,
    league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    
    -- Roster settings
    max_games_per_week INTEGER, -- Limit on player appearances
    ir_spots INTEGER DEFAULT 0, -- Injured reserve spots
    taxi_squad_spots INTEGER DEFAULT 0, -- Dynasty taxi squad
    
    -- Trade settings
    trade_review_period_hours INTEGER DEFAULT 24,
    trades_allowed BOOLEAN DEFAULT TRUE,
    allow_bench_trades BOOLEAN DEFAULT FALSE,
    
    -- Waiver settings
    waiver_period_days INTEGER DEFAULT 2,
    waiver_clear_days TEXT, -- Comma-separated: 'Mon,Wed,Fri'
    
    -- Playoff settings
    playoff_format VARCHAR(20) DEFAULT 'standard', -- 'standard', 'bracket', 'top_n'
    playoff_weeks INTEGER DEFAULT 3,
    consolation_bracket BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- One settings entry per league
    CONSTRAINT unique_league_settings UNIQUE (league_id)
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Leagues indexes
CREATE INDEX IF NOT EXISTS idx_leagues_commissioner ON leagues(commissioner_id);
CREATE INDEX IF NOT EXISTS idx_leagues_season ON leagues(season);
CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);

-- League memberships indexes
CREATE INDEX IF NOT EXISTS idx_league_memberships_league ON league_memberships(league_id);
CREATE INDEX IF NOT EXISTS idx_league_memberships_team ON league_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_league_memberships_wins_losses ON league_memberships(wins DESC, losses ASC);

-- Weekly matchups indexes
CREATE INDEX IF NOT EXISTS idx_weekly_matchups_league_week ON weekly_matchups(league_id, week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_matchups_team1 ON weekly_matchups(team1_id);
CREATE INDEX IF NOT EXISTS idx_weekly_matchups_team2 ON weekly_matchups(team2_id);
CREATE INDEX IF NOT EXISTS idx_weekly_matchups_status ON weekly_matchups(status);

-- Weekly lineups indexes
CREATE INDEX IF NOT EXISTS idx_weekly_lineups_matchup ON weekly_lineups(matchup_id);
CREATE INDEX IF NOT EXISTS idx_weekly_lineups_team ON weekly_lineups(team_id);
CREATE INDEX IF NOT EXISTS idx_weekly_lineups_week ON weekly_lineups(week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_lineups_locked ON weekly_lineups(is_locked);

-- Player weekly stats indexes
CREATE INDEX IF NOT EXISTS idx_player_weekly_stats_player ON player_weekly_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_weekly_stats_week ON player_weekly_stats(week_number, season);
CREATE INDEX IF NOT EXISTS idx_player_weekly_stats_points ON player_weekly_stats(fantasy_points DESC);

-- Trades indexes
CREATE INDEX IF NOT EXISTS idx_trades_league ON trades(league_id);
CREATE INDEX IF NOT EXISTS idx_trades_team1 ON trades(team1_id);
CREATE INDEX IF NOT EXISTS idx_trades_team2 ON trades(team2_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);

-- Waiver transactions indexes
CREATE INDEX IF NOT EXISTS idx_waiver_transactions_league ON waiver_transactions(league_id);
CREATE INDEX IF NOT EXISTS idx_waiver_transactions_team ON waiver_transactions(team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_transactions_week ON waiver_transactions(week_number);
CREATE INDEX IF NOT EXISTS idx_waiver_transactions_status ON waiver_transactions(status);

-- Draft picks indexes
CREATE INDEX IF NOT EXISTS idx_draft_picks_league_season ON draft_picks(league_id, season);
CREATE INDEX IF NOT EXISTS idx_draft_picks_team ON draft_picks(team_id);
CREATE INDEX IF NOT EXISTS idx_draft_picks_player ON draft_picks(player_id);

-- League messages indexes
CREATE INDEX IF NOT EXISTS idx_league_messages_league ON league_messages(league_id);
CREATE INDEX IF NOT EXISTS idx_league_messages_parent ON league_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_league_messages_created ON league_messages(created_at DESC);

-- ============================================
-- CREATE TRIGGERS
-- ============================================

-- Update timestamp triggers (reuse existing function if it exists)
DO $$ BEGIN
    CREATE TRIGGER update_leagues_updated_at 
        BEFORE UPDATE ON leagues 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_scoring_settings_updated_at 
        BEFORE UPDATE ON scoring_settings 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_weekly_lineups_updated_at 
        BEFORE UPDATE ON weekly_lineups 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_league_settings_updated_at 
        BEFORE UPDATE ON league_settings 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE leagues IS 'Core league management table. Manages H2H league configuration and status.';
COMMENT ON TABLE league_memberships IS 'Tracks team participation in leagues with standings and waiver management.';
COMMENT ON TABLE scoring_settings IS 'Customizable scoring rules for each league.';
COMMENT ON TABLE weekly_matchups IS 'H2H weekly matchups between teams with scoring results.';
COMMENT ON TABLE weekly_lineups IS 'Sleeper-style locked lineups for each team in each matchup.';
COMMENT ON TABLE player_weekly_stats IS 'Aggregated player statistics for each week of the season.';
COMMENT ON TABLE trades IS 'Player trades between teams with review and veto system.';
COMMENT ON TABLE waiver_transactions IS 'Free agent pickups and drops via waivers or FAAB.';
COMMENT ON TABLE draft_picks IS 'Draft history and keeper support.';
COMMENT ON TABLE league_messages IS 'League chat and communication between members.';
COMMENT ON TABLE league_settings IS 'Extended league configuration and advanced features.';

COMMENT ON COLUMN weekly_lineups.bench_player_ids IS 'JSON array of player IDs on bench (non-scoring).';
COMMENT ON COLUMN player_weekly_stats.game_logs IS 'JSON array of individual game statistics for the week.';
COMMENT ON COLUMN trades.team1_players IS 'JSON array of player IDs from team 1.';
COMMENT ON COLUMN trades.team2_players IS 'JSON array of player IDs from team 2.';

