-- Create player_wishlist table
-- This table allows users to mark preferred players for draft recommendations
-- Wishlist players will get a ranking boost in AI recommendations

CREATE TABLE IF NOT EXISTS player_wishlist (
    id SERIAL PRIMARY KEY,
    owner TEXT NOT NULL, -- Stack Auth user ID
    player_id VARCHAR(20) NOT NULL, -- References nba_stats.player_id (no FK constraint per neon-auth guidelines)
    season INTEGER NOT NULL,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10), -- 1 = highest priority
    notes TEXT, -- Optional notes about why user wants this player
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_owner_player_season UNIQUE (owner, player_id, season)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_wishlist_owner ON player_wishlist(owner);
CREATE INDEX IF NOT EXISTS idx_player_wishlist_season ON player_wishlist(season);
CREATE INDEX IF NOT EXISTS idx_player_wishlist_owner_season ON player_wishlist(owner, season);
CREATE INDEX IF NOT EXISTS idx_player_wishlist_player_id ON player_wishlist(player_id);

-- Add comment to table
COMMENT ON TABLE player_wishlist IS 'Stores user wishlist preferences for NBA players. Wishlist players get priority boosts in draft recommendations.';
COMMENT ON COLUMN player_wishlist.priority IS 'Priority level 1-10, where 1 is highest priority. Used to boost ranking in AI recommendations.';
COMMENT ON COLUMN player_wishlist.notes IS 'User notes about why they want this player (e.g., "Fits my punt FG% strategy")';

