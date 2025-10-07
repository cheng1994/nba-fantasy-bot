-- Create NBA News and Injuries table for Neon database
-- This table stores recent NBA news, injuries, and other events that affect fantasy performance

CREATE TABLE IF NOT EXISTS nba_news (
    id SERIAL PRIMARY KEY,
    
    -- Player Information
    player_name VARCHAR(100),
    player_id VARCHAR(20),
    team VARCHAR(10),
    
    -- News Content
    title VARCHAR(500) NOT NULL,
    content TEXT,
    summary TEXT,
    
    -- Categorization
    category VARCHAR(50) NOT NULL, -- 'injury', 'trade', 'suspension', 'performance', 'roster', 'other'
    severity VARCHAR(20), -- 'minor', 'moderate', 'severe', 'season_ending' (for injuries)
    impact_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    
    -- Status Information
    status VARCHAR(50), -- 'active', 'resolved', 'monitoring' (for injuries)
    expected_return_date DATE, -- For injuries
    games_missed INTEGER, -- Number of games expected to miss
    
    -- Source Information
    source VARCHAR(100) NOT NULL, -- 'espn', 'nba', 'rotoworld', 'twitter', etc.
    source_url TEXT,
    author VARCHAR(100),
    
    -- Timestamps
    published_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional Metadata
    tags TEXT[], -- Array of tags like ['knee', 'out', 'week-to-week']
    affected_stats TEXT[], -- Array of stats that might be affected ['minutes', 'points', 'rebounds']
    fantasy_impact_note TEXT -- AI-generated note about fantasy impact
    
);

-- Create unique constraint to prevent duplicate news items
-- This ensures we don't store the same article multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_nba_news_unique_article ON nba_news(title, published_at);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nba_news_player_name ON nba_news(player_name);
CREATE INDEX IF NOT EXISTS idx_nba_news_player_id ON nba_news(player_id);
CREATE INDEX IF NOT EXISTS idx_nba_news_team ON nba_news(team);
CREATE INDEX IF NOT EXISTS idx_nba_news_category ON nba_news(category);
CREATE INDEX IF NOT EXISTS idx_nba_news_severity ON nba_news(severity);
CREATE INDEX IF NOT EXISTS idx_nba_news_impact_level ON nba_news(impact_level);
CREATE INDEX IF NOT EXISTS idx_nba_news_status ON nba_news(status);
CREATE INDEX IF NOT EXISTS idx_nba_news_published_at ON nba_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_nba_news_created_at ON nba_news(created_at DESC);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_nba_news_player_category ON nba_news(player_name, category);
CREATE INDEX IF NOT EXISTS idx_nba_news_team_category ON nba_news(team, category);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_nba_news_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nba_news_updated_at 
    BEFORE UPDATE ON nba_news 
    FOR EACH ROW 
    EXECUTE FUNCTION update_nba_news_updated_at_column();

-- Create a view for active injuries
CREATE OR REPLACE VIEW active_injuries AS
SELECT 
    player_name,
    player_id,
    team,
    title,
    summary,
    severity,
    impact_level,
    status,
    expected_return_date,
    games_missed,
    published_at,
    fantasy_impact_note
FROM nba_news 
WHERE category = 'injury' 
    AND status IN ('active', 'monitoring')
    AND published_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY impact_level DESC, published_at DESC;

-- Create a view for recent news (last 7 days)
CREATE OR REPLACE VIEW recent_nba_news AS
SELECT 
    player_name,
    player_id,
    team,
    title,
    summary,
    category,
    severity,
    impact_level,
    published_at,
    source,
    fantasy_impact_note
FROM nba_news 
WHERE published_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY published_at DESC;

-- Add comments for documentation
COMMENT ON TABLE nba_news IS 'Stores NBA news, injuries, and events that affect fantasy performance';
COMMENT ON COLUMN nba_news.category IS 'Type of news: injury, trade, suspension, performance, roster, other';
COMMENT ON COLUMN nba_news.severity IS 'Severity level: minor, moderate, severe, season_ending (for injuries)';
COMMENT ON COLUMN nba_news.impact_level IS 'Fantasy impact: low, medium, high, critical';
COMMENT ON COLUMN nba_news.status IS 'Current status: active, resolved, monitoring (for injuries)';
COMMENT ON COLUMN nba_news.affected_stats IS 'Array of fantasy stats that might be affected';
COMMENT ON COLUMN nba_news.fantasy_impact_note IS 'AI-generated analysis of fantasy impact';
