-- Add unique constraint to prevent duplicate player records
-- A player can only have one record per season per team

-- First, remove any existing duplicates (keeping the most recent one)
DELETE FROM nba_stats a USING nba_stats b
WHERE a.id < b.id 
  AND a.player_id = b.player_id 
  AND a.season = b.season 
  AND a.team = b.team;

-- Add unique constraint
ALTER TABLE nba_stats 
ADD CONSTRAINT unique_player_season_team 
UNIQUE (player_id, season, team);

