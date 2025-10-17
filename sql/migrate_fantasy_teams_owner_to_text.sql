-- Migration: Update fantasy_teams.owner to work with Stack Auth user IDs
-- This changes the owner column from VARCHAR(100) to TEXT to match Stack Auth user IDs
-- 
-- Note: No foreign key constraint is created because Stack Auth users are stored
-- in Stack Auth's external database, not in your Neon database.
-- 
-- If you want FK constraints, see: sql/optional_local_users_sync.sql

-- Update the owner column type to TEXT (matches Stack Auth user.id type)
ALTER TABLE fantasy_teams 
    ALTER COLUMN owner TYPE TEXT;

-- Add a comment to document the relationship
COMMENT ON COLUMN fantasy_teams.owner IS 'Stack Auth user ID (user.id) - No FK constraint because users are in external Stack Auth database';

-- Example usage in application:
-- 
-- Server Component:
--   const user = await stackServerApp.getUser({ or: "redirect" });
--   const teams = await getFantasyTeamsByOwner(user.id, 2025);
--
-- Creating a team:
--   const user = await stackServerApp.getUser({ or: "redirect" });
--   const team = await createFantasyTeam({
--     name: "My Fantasy Team",
--     owner: user.id,
--     season: 2025
--   });

