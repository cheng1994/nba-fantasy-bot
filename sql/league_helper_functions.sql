-- League Helper Functions and Advanced Constraints
-- Supplementary functions for league management

-- ============================================
-- FUNCTIONS FOR LEAGUE MANAGEMENT
-- ============================================

-- Function to calculate fantasy points based on scoring settings
CREATE OR REPLACE FUNCTION calculate_fantasy_points(
    p_points INTEGER,
    p_rebounds INTEGER,
    p_assists INTEGER,
    p_steals INTEGER,
    p_blocks INTEGER,
    p_turnovers INTEGER,
    p_three_pm INTEGER,
    p_fg_made INTEGER,
    p_fg_missed INTEGER,
    p_ft_made INTEGER,
    p_ft_missed INTEGER,
    p_double_doubles INTEGER,
    p_triple_doubles INTEGER,
    p_pts_per_point DECIMAL DEFAULT 1.00,
    p_pts_per_rebound DECIMAL DEFAULT 1.20,
    p_pts_per_assist DECIMAL DEFAULT 1.50,
    p_pts_per_steal DECIMAL DEFAULT 3.00,
    p_pts_per_block DECIMAL DEFAULT 3.00,
    p_pts_per_turnover DECIMAL DEFAULT -1.00,
    p_pts_per_3pm DECIMAL DEFAULT 0.50,
    p_pts_per_fg_missed DECIMAL DEFAULT -0.50,
    p_pts_per_ft_missed DECIMAL DEFAULT -0.50,
    p_pts_per_double_double DECIMAL DEFAULT 1.50,
    p_pts_per_triple_double DECIMAL DEFAULT 3.00
) RETURNS DECIMAL AS $$
BEGIN
    RETURN 
        (p_points * p_pts_per_point) +
        (p_rebounds * p_pts_per_rebound) +
        (p_assists * p_pts_per_assist) +
        (p_steals * p_pts_per_steal) +
        (p_blocks * p_pts_per_block) +
        (p_turnovers * p_pts_per_turnover) +
        (p_three_pm * p_pts_per_3pm) +
        (p_fg_missed * p_pts_per_fg_missed) +
        (p_ft_missed * p_pts_per_ft_missed) +
        (p_double_doubles * p_pts_per_double_double) +
        (p_triple_doubles * p_pts_per_triple_double);
END;
$$ LANGUAGE plpgsql;

-- Function to update matchup results
CREATE OR REPLACE FUNCTION update_matchup_results(p_matchup_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_team1_score DECIMAL;
    v_team2_score DECIMAL;
    v_team1_id INTEGER;
    v_team2_id INTEGER;
    v_winner_id INTEGER;
BEGIN
    -- Get total scores for both teams
    SELECT COALESCE(SUM(total_points), 0) INTO v_team1_score
    FROM weekly_lineups
    WHERE matchup_id = p_matchup_id
      AND team_id = (SELECT team1_id FROM weekly_matchups WHERE id = p_matchup_id);
    
    SELECT COALESCE(SUM(total_points), 0) INTO v_team2_score
    FROM weekly_lineups
    WHERE matchup_id = p_matchup_id
      AND team_id = (SELECT team2_id FROM weekly_matchups WHERE id = p_matchup_id);
    
    -- Get team IDs
    SELECT team1_id, team2_id INTO v_team1_id, v_team2_id
    FROM weekly_matchups
    WHERE id = p_matchup_id;
    
    -- Determine winner
    IF v_team1_score > v_team2_score THEN
        v_winner_id := v_team1_id;
    ELSIF v_team2_score > v_team1_score THEN
        v_winner_id := v_team2_id;
    ELSE
        v_winner_id := NULL; -- Tie
    END IF;
    
    -- Update matchup
    UPDATE weekly_matchups
    SET 
        team1_score = v_team1_score,
        team2_score = v_team2_score,
        winner_id = v_winner_id,
        status = 'final'
    WHERE id = p_matchup_id;
    
    -- Update league standings if not a tie
    IF v_winner_id IS NOT NULL THEN
        -- Update winner
        UPDATE league_memberships
        SET 
            wins = wins + 1,
            points_for = points_for + COALESCE(v_team1_score, v_team2_score),
            points_against = points_against + COALESCE(v_team2_score, v_team1_score)
        WHERE id = v_winner_id;
        
        -- Update loser
        UPDATE league_memberships
        SET 
            losses = losses + 1,
            points_for = points_for + COALESCE(v_team2_score, v_team1_score),
            points_against = points_against + COALESCE(v_team1_score, v_team2_score)
        WHERE id = COALESCE(NULLIF(v_team1_id, v_winner_id), v_team2_id);
    ELSE
        -- Update both teams for a tie
        UPDATE league_memberships
        SET 
            ties = ties + 1,
            points_for = points_for + COALESCE(v_team1_score, v_team2_score),
            points_against = points_against + COALESCE(v_team2_score, v_team1_score)
        WHERE id IN (v_team1_id, v_team2_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can lock lineup
CREATE OR REPLACE FUNCTION can_lock_lineup(p_lineup_id INTEGER, p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_team_owner TEXT;
    v_is_locked BOOLEAN;
    v_matchup_status VARCHAR;
BEGIN
    -- Check if lineup is already locked
    SELECT is_locked INTO v_is_locked
    FROM weekly_lineups
    WHERE id = p_lineup_id;
    
    IF v_is_locked THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user owns this team
    SELECT owner INTO v_team_owner
    FROM fantasy_teams
    WHERE id = (
        SELECT team_id FROM league_memberships
        WHERE id = (SELECT team_id FROM weekly_lineups WHERE id = p_lineup_id)
    );
    
    IF v_team_owner != p_user_id THEN
        RETURN FALSE;
    END IF;
    
    -- Check matchup status
    SELECT status INTO v_matchup_status
    FROM weekly_matchups
    WHERE id = (SELECT matchup_id FROM weekly_lineups WHERE id = p_lineup_id);
    
    IF v_matchup_status IN ('locked', 'final') THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate roster before lock
CREATE OR REPLACE FUNCTION validate_lineup_for_lock(p_lineup_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_missing_required INTEGER := 0;
BEGIN
    -- Check for required starting positions
    SELECT COUNT(*) INTO v_missing_required
    FROM weekly_lineups
    WHERE id = p_lineup_id
      AND (
        pg_player_id IS NULL OR
        sg_player_id IS NULL OR
        sf_player_id IS NULL OR
        pf_player_id IS NULL OR
        c_player_id IS NULL OR
        g_player_id IS NULL OR
        f_player_id IS NULL OR
        util1_player_id IS NULL OR
        util2_player_id IS NULL
      );
    
    RETURN v_missing_required = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create matchup schedule
CREATE OR REPLACE FUNCTION create_matchup_schedule(
    p_league_id INTEGER,
    p_season INTEGER,
    p_start_week INTEGER,
    p_end_week INTEGER,
    p_max_teams INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_teams INTEGER[];
    v_team_count INTEGER;
    v_week INTEGER;
    v_matchup_id INTEGER;
    v_team1_idx INTEGER;
    v_team2_idx INTEGER;
BEGIN
    -- Get list of teams in league
    SELECT ARRAY_AGG(id ORDER BY RANDOM()) INTO v_teams
    FROM league_memberships
    WHERE league_id = p_league_id;
    
    v_team_count := array_length(v_teams, 1);
    
    -- Create matchups for each week
    FOR v_week IN p_start_week..p_end_week LOOP
        -- If odd number of teams, create bye weeks
        FOR i IN 0..v_team_count - 1 LOOP
            v_team1_idx := (i % v_team_count) + 1;
            v_team2_idx := ((i + (v_team_count / 2)) % v_team_count) + 1;
            
            -- Skip if same team
            IF v_team1_idx != v_team2_idx THEN
                INSERT INTO weekly_matchups (
                    league_id, 
                    week_number, 
                    season, 
                    team1_id, 
                    team2_id
                ) VALUES (
                    p_league_id,
                    v_week,
                    p_season,
                    v_teams[v_team1_idx],
                    v_teams[v_team2_idx]
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to process waiver transactions
CREATE OR REPLACE FUNCTION process_waiver_transactions(p_league_id INTEGER, p_week_number INTEGER)
RETURNS VOID AS $$
DECLARE
    v_transaction RECORD;
    v_waiver_type VARCHAR;
BEGIN
    -- Get league waiver type
    SELECT waiver_type INTO v_waiver_type
    FROM leagues
    WHERE id = p_league_id;
    
    -- Process by waiver type
    IF v_waiver_type = 'faab' THEN
        -- Process FAAB bids (highest wins)
        FOR v_transaction IN
            SELECT * FROM waiver_transactions
            WHERE league_id = p_league_id
              AND week_number = p_week_number
              AND status = 'pending'
              AND action_type IN ('add', 'add_drop')
            ORDER BY faab_bid DESC, created_at ASC
        LOOP
            -- Check if player is still available and team has budget
            -- Implementation would check available players and budget
            UPDATE waiver_transactions
            SET status = 'successful', processed_at = NOW()
            WHERE id = v_transaction.id;
        END LOOP;
    ELSE
        -- Process by waiver priority (reverse standings)
        FOR v_transaction IN
            SELECT w.* 
            FROM waiver_transactions w
            JOIN league_memberships lm ON w.team_id = lm.id
            WHERE w.league_id = p_league_id
              AND w.week_number = p_week_number
              AND w.status = 'pending'
              AND w.action_type IN ('add', 'add_drop')
            ORDER BY lm.waiver_priority ASC, w.created_at ASC
        LOOP
            UPDATE waiver_transactions
            SET status = 'successful', processed_at = NOW()
            WHERE id = v_transaction.id;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ADDITIONAL CONSTRAINTS AND TRIGGERS
-- ============================================

-- Constraint: Ensure matchup teams are different
ALTER TABLE weekly_matchups
ADD CONSTRAINT check_matchup_teams_different 
CHECK (team1_id IS NULL OR team2_id IS NULL OR team1_id != team2_id);

-- Constraint: Ensure lineup has required positions filled
ALTER TABLE weekly_lineups
ADD CONSTRAINT check_lineup_required_positions 
CHECK (
    pg_player_id IS NOT NULL AND
    sg_player_id IS NOT NULL AND
    sf_player_id IS NOT NULL AND
    pf_player_id IS NOT NULL AND
    c_player_id IS NOT NULL AND
    g_player_id IS NOT NULL AND
    f_player_id IS NOT NULL AND
    util1_player_id IS NOT NULL AND
    util2_player_id IS NOT NULL
);

-- Trigger: Auto-lock lineup when game time arrives (placeholder for implementation)
-- This would be implemented with a cron job or scheduled task

-- Trigger: Prevent duplicate starting players in lineup
CREATE OR REPLACE FUNCTION check_duplicate_starters()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for duplicate player IDs in starting lineup
    IF (
        NEW.pg_player_id IN (NEW.sg_player_id, NEW.sf_player_id, NEW.pf_player_id, NEW.c_player_id, 
                            NEW.g_player_id, NEW.f_player_id, NEW.util1_player_id, NEW.util2_player_id) OR
        NEW.sg_player_id IN (NEW.pg_player_id, NEW.sf_player_id, NEW.pf_player_id, NEW.c_player_id, 
                            NEW.g_player_id, NEW.f_player_id, NEW.util1_player_id, NEW.util2_player_id) OR
        NEW.sf_player_id IN (NEW.pg_player_id, NEW.sg_player_id, NEW.pf_player_id, NEW.c_player_id, 
                            NEW.g_player_id, NEW.f_player_id, NEW.util1_player_id, NEW.util2_player_id) OR
        NEW.pf_player_id IN (NEW.pg_player_id, NEW.sg_player_id, NEW.sf_player_id, NEW.c_player_id, 
                            NEW.g_player_id, NEW.f_player_id, NEW.util1_player_id, NEW.util2_player_id) OR
        NEW.c_player_id IN (NEW.pg_player_id, NEW.sg_player_id, NEW.sf_player_id, NEW.pf_player_id, 
                           NEW.g_player_id, NEW.f_player_id, NEW.util1_player_id, NEW.util2_player_id)
    ) THEN
        RAISE EXCEPTION 'Cannot start the same player in multiple positions';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_weekly_lineup_duplicates
    BEFORE INSERT OR UPDATE ON weekly_lineups
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_starters();

-- Trigger: Update league settings when created
CREATE OR REPLACE FUNCTION create_default_league_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO league_settings (league_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_league_settings
    AFTER INSERT ON leagues
    FOR EACH ROW
    EXECUTE FUNCTION create_default_league_settings();

-- Trigger: Create default scoring settings for new league
CREATE OR REPLACE FUNCTION create_default_scoring_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO scoring_settings (league_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_scoring_settings
    AFTER INSERT ON leagues
    FOR EACH ROW
    EXECUTE FUNCTION create_default_scoring_settings();

-- Comments for documentation
COMMENT ON FUNCTION calculate_fantasy_points IS 'Calculates fantasy points based on stat values and league scoring settings.';
COMMENT ON FUNCTION update_matchup_results IS 'Updates matchup scores and updates league standings.';
COMMENT ON FUNCTION can_lock_lineup IS 'Checks if a user can lock their lineup based on ownership and status.';
COMMENT ON FUNCTION validate_lineup_for_lock IS 'Validates that all required starting positions are filled.';
COMMENT ON FUNCTION create_matchup_schedule IS 'Auto-generates a round-robin matchup schedule for a league.';
COMMENT ON FUNCTION process_waiver_transactions IS 'Processes pending waiver claims based on league waiver type.';

