-- Create Fantasy Teams tables for Neon database
-- These tables track user fantasy teams and their rosters

-- Create fantasy_teams table
CREATE TABLE IF NOT EXISTS fantasy_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    season INTEGER NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Ensure one team per owner per season
    CONSTRAINT unique_owner_season UNIQUE (owner, season)
);

-- Create team_rosters table
-- Each team can have up to 13 players
-- Required positions: PG, SG, SF, PF, C, G
-- Additional positions: F, UTIL, BENCH
CREATE TABLE IF NOT EXISTS team_rosters (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
    player_id VARCHAR(20) NOT NULL,
    
    -- Designated position on the fantasy team (where they're slotted)
    -- Valid values: PG, SG, SF, PF, C, G, F, UTIL, BENCH
    designated_position VARCHAR(10) NOT NULL,
    
    -- Player's eligible positions (can be multiple, stored as comma-separated)
    -- Examples: "PG,SG" or "SF,PF" or "C"
    eligible_positions TEXT NOT NULL,
    
    -- Order in roster display
    roster_order INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Ensure a player can only be on a team once
    CONSTRAINT unique_team_player UNIQUE (team_id, player_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fantasy_teams_owner ON fantasy_teams(owner);
CREATE INDEX IF NOT EXISTS idx_fantasy_teams_season ON fantasy_teams(season);
CREATE INDEX IF NOT EXISTS idx_team_rosters_team_id ON team_rosters(team_id);
CREATE INDEX IF NOT EXISTS idx_team_rosters_player_id ON team_rosters(player_id);
CREATE INDEX IF NOT EXISTS idx_team_rosters_designated_position ON team_rosters(designated_position);

-- Create triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fantasy_teams_updated_at 
    BEFORE UPDATE ON fantasy_teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add a check constraint to ensure roster size doesn't exceed 13 players
-- Note: This is enforced at the application level, but we can add a trigger for database-level enforcement

CREATE OR REPLACE FUNCTION check_roster_size()
RETURNS TRIGGER AS $$
DECLARE
    roster_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO roster_count
    FROM team_rosters
    WHERE team_id = NEW.team_id;
    
    IF roster_count >= 13 THEN
        RAISE EXCEPTION 'Team roster cannot exceed 13 players';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_team_roster_size
    BEFORE INSERT ON team_rosters
    FOR EACH ROW
    EXECUTE FUNCTION check_roster_size();

-- Comments for documentation
COMMENT ON TABLE fantasy_teams IS 'Stores fantasy team information for each user';
COMMENT ON TABLE team_rosters IS 'Stores the 13-player roster for each fantasy team with position assignments';
COMMENT ON COLUMN team_rosters.designated_position IS 'The position slot this player fills on the team (PG, SG, SF, PF, C, G, F, UTIL, or BENCH)';
COMMENT ON COLUMN team_rosters.eligible_positions IS 'Comma-separated list of positions the player can play (e.g., "PG,SG" or "C")';

