-- Create NBA Stats table for Neon database
-- This table stores comprehensive NBA player statistics

CREATE TABLE IF NOT EXISTS nba_stats (
    id SERIAL PRIMARY KEY,
    season INTEGER NOT NULL,
    league VARCHAR(10) NOT NULL,
    player VARCHAR(100) NOT NULL,
    player_id VARCHAR(20) NOT NULL,
    age INTEGER,
    team VARCHAR(10),
    position VARCHAR(5),
    
    -- Fantasy Points
    fpts_total DECIMAL(10,2),
    fpts DECIMAL(10,2),
    
    -- Games
    games INTEGER,
    games_started INTEGER,
    minutes_played INTEGER,
    
    -- Field Goals
    fg_made INTEGER,
    fg_attempted INTEGER,
    fg_percentage DECIMAL(5,3),
    
    -- 3-Point Field Goals
    x3p_made INTEGER,
    x3p_attempted INTEGER,
    x3p_percentage DECIMAL(5,3),
    
    -- 2-Point Field Goals
    x2p_made INTEGER,
    x2p_attempted INTEGER,
    x2p_percentage DECIMAL(5,3),
    
    -- Effective Field Goal Percentage
    e_fg_percentage DECIMAL(5,3),
    
    -- Free Throws
    ft_made INTEGER,
    ft_attempted INTEGER,
    ft_percentage DECIMAL(5,3),
    
    -- Rebounds
    offensive_rebounds INTEGER,
    defensive_rebounds INTEGER,
    total_rebounds INTEGER,
    
    -- Other Stats
    assists INTEGER,
    steals INTEGER,
    blocks INTEGER,
    turnovers INTEGER,
    personal_fouls INTEGER,
    points INTEGER,
    triple_doubles INTEGER,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nba_stats_season ON nba_stats(season);
CREATE INDEX IF NOT EXISTS idx_nba_stats_player_id ON nba_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_nba_stats_team ON nba_stats(team);
CREATE INDEX IF NOT EXISTS idx_nba_stats_position ON nba_stats(position);
CREATE INDEX IF NOT EXISTS idx_nba_stats_fpts_total ON nba_stats(fpts_total DESC);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nba_stats_updated_at 
    BEFORE UPDATE ON nba_stats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

