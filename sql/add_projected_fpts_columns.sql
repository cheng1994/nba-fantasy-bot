-- Add projected fantasy points columns to nba_stats table
-- These columns store ESPN fantasy projections for the season

ALTER TABLE nba_stats 
ADD COLUMN IF NOT EXISTS projected_fpts_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS projected_fpts_avg DECIMAL(10,2);

-- Add index for projected fantasy points for better query performance
CREATE INDEX IF NOT EXISTS idx_nba_stats_projected_fpts_total ON nba_stats(projected_fpts_total DESC);

-- Add comment to columns
COMMENT ON COLUMN nba_stats.projected_fpts_total IS 'ESPN projected total fantasy points for the season';
COMMENT ON COLUMN nba_stats.projected_fpts_avg IS 'ESPN projected average fantasy points per game';

