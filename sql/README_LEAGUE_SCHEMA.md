# League Database Schema Documentation

## Overview

This schema extends the NBA Fantasy Bot to support full H2H (head-to-head) fantasy leagues with Sleeper-style lineup locking features. The schema includes 11 core tables plus helper functions for complete league management.

## Database Tables

### 1. `leagues`
Core league management and configuration.

**Key Features:**
- Supports multiple league types (H2H Points, H2H Categories, Roto)
- Configurable lineup lock times (game-time, daily, weekly)
- Multiple waiver systems (FAAB, rolling priority, reverse standings)
- Playoff configuration and draft scheduling

**Important Fields:**
- `commissioner_id`: Stack Auth user ID of league manager
- `status`: Current league state (draft → active → playoffs → completed)
- `lineup_lock_time`: When lineups lock ('game_time', 'daily_lock', 'weekly_lock')
- `waiver_type`: Waiver system type ('faab', 'rolling', 'reverse_standings')

### 2. `league_memberships`
Tracks team participation in leagues with standings.

**Key Features:**
- Links `fantasy_teams` to `leagues`
- Tracks W-L-T record
- Points for/against totals
- Waiver priority and FAAB budget management

**Important Fields:**
- `team_id`: FK to `fantasy_teams` table
- `draft_position`: Original draft pick order
- `faab_budget`: Remaining FAAB dollars (default $100)
- `waiver_priority`: Current waiver claim priority

### 3. `scoring_settings`
Customizable scoring rules per league.

**Key Features:**
- Default ESPN standard scoring included
- Customizable points per stat
- Bonus scoring for double/triple doubles
- Field goal/FT miss penalties

**Default Scoring:**
- Points: 1.0 pt
- Rebounds: 1.2 pts
- Assists: 1.5 pts
- Steals: 3.0 pts
- Blocks: 3.0 pts
- Turnovers: -1.0 pts
- 3PM bonus: 0.5 pts

### 4. `weekly_matchups`
H2H weekly schedule and results.

**Key Features:**
- Automatic schedule generation support
- Tracks scores and winners
- Playoff bracket support
- Lock status tracking

**Important Fields:**
- `team1_id`, `team2_id`: FK to `league_memberships`
- `status`: 'upcoming', 'locked', 'in_progress', 'final'
- `is_playoff_matchup`: Boolean for playoff differentiation

### 5. `weekly_lineups` (Sleeper Lock-In Feature)
The centerpiece of the lock-in feature.

**Key Features:**
- 9 starting positions required
- Bench spots tracked in JSON
- `is_locked` boolean for locked status
- `locked_at` timestamp for when lineup locked
- Total points calculated per lineup

**Starting Positions:**
1. PG (Point Guard)
2. SG (Shooting Guard)
3. SF (Small Forward)
4. PF (Power Forward)
5. C (Center)
6. G (Flex Guard)
7. F (Flex Forward)
8. UTIL1 (Utility)
9. UTIL2 (Utility)

**Bench Storage:**
- `bench_player_ids`: JSON array of player IDs
- Example: `["jamesle01", "browaan01", "hartj01"]`

### 6. `player_weekly_stats`
Aggregated player statistics per week.

**Key Features:**
- Auto-aggregated from game logs
- Fantasy points pre-calculated
- Weekly totals for all categories
- JSON game logs for detailed tracking

**Important Fields:**
- Weekly totals: points, rebounds, assists, etc.
- `fantasy_points`: Pre-calculated based on default scoring
- `game_logs`: JSON array of individual game stats

### 7. `trades`
Player trade management with review system.

**Key Features:**
- Two-team trades with JSON player arrays
- Status workflow: proposed → accepted → completed
- Veto system support
- Trade deadline enforcement

**Important Fields:**
- `team1_players`, `team2_players`: JSON arrays of player IDs
- `proposed_by`: Team ID who initiated trade
- `status`: Workflow states
- `review_deadline`: League review window (usually 24-48 hours)

### 8. `waiver_transactions`
Free agent pickups via waivers or FAAB.

**Key Features:**
- Supports FAAB bidding system
- Rolling waiver priority support
- Add/drop transaction types
- Processed status tracking

**Important Fields:**
- `action_type`: 'add', 'drop', 'add_drop'
- `faab_bid`: Bid amount in FAAB system
- `waiver_priority`: Priority number in rolling system
- `status`: 'pending', 'successful', 'failed', 'cancelled'

### 9. `draft_picks`
Complete draft history and tracking.

**Key Features:**
- Round and pick tracking
- Keeper pick support
- Traded pick tracking (original team)
- Draft order preservation

**Important Fields:**
- `pick_number`: Overall pick (1, 2, 3, ...)
- `round`: Round number
- `pick_in_round`: Pick within round
- `original_team_id`: If pick was traded
- `is_keeper_pick`: Boolean for keeper leagues

### 10. `league_messages`
League chat and communication.

**Key Features:**
- General chat for all messages
- Trade talk channel
- Trash talk support
- Thread/reply functionality
- Message reactions (JSON)

**Important Fields:**
- `message_type`: 'general', 'trade_talk', 'trash_talk', 'announcement'
- `parent_message_id`: For threaded replies
- `reactions`: JSON object with emoji counts

### 11. `league_settings`
Extended configuration options.

**Key Features:**
- Injured Reserve (IR) spots
- Max games per week limits
- Trade review periods
- Playoff format options
- Dynasty league support (taxi squad)

**Important Fields:**
- `ir_spots`: Number of IR roster spots
- `taxi_squad_spots`: Dynasty taxi squad spots
- `trade_review_period_hours`: Veto review window
- `playoff_format`: 'standard', 'bracket', 'top_n'

---

## Helper Functions

### Scoring Functions

#### `calculate_fantasy_points(...)`
Calculates fantasy points based on stats and league scoring settings.

**Usage:**
```sql
SELECT calculate_fantasy_points(
    30, 10, 15, 2, 1, 3, 4, 12, 5, 8, 2, 0, 0,
    -- Override scoring settings (optional)
    1.0, 1.2, 1.5, 3.0, 3.0, -1.0, 0.5, -0.5, -0.5, 1.5, 3.0
) AS fantasy_points;
```

### Matchup Functions

#### `update_matchup_results(p_matchup_id)`
Updates matchup final scores and league standings.

**Usage:**
```sql
-- Calculate and finalize a matchup
SELECT update_matchup_results(123);
```

### Lineup Functions

#### `can_lock_lineup(p_lineup_id, p_user_id)`
Validates if user can lock their lineup.

#### `validate_lineup_for_lock(p_lineup_id)`
Checks all required starting positions are filled.

**Usage:**
```sql
-- Check if user can lock
SELECT can_lock_lineup(456, 'user123') AS can_lock;

-- Validate lineup is legal
SELECT validate_lineup_for_lock(456) AS is_valid;
```

### Schedule Functions

#### `create_matchup_schedule(p_league_id, p_season, p_start_week, p_end_week, p_max_teams)`
Auto-generates round-robin schedule.

**Usage:**
```sql
-- Create 14-week schedule starting week 1
SELECT create_matchup_schedule(1, 2025, 1, 14, 12);
```

### Waiver Functions

#### `process_waiver_transactions(p_league_id, p_week_number)`
Processes pending waiver claims based on league settings.

**Usage:**
```sql
-- Process week 5 waivers for league 1
SELECT process_waiver_transactions(1, 5);
```

---

## Migration Steps

### 1. Create Tables
```bash
psql $DATABASE_URL -f sql/create_league_tables.sql
```

### 2. Create Helper Functions
```bash
psql $DATABASE_URL -f sql/league_helper_functions.sql
```

### 3. Verify Installation
```sql
-- Check all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'leagues', 'league_memberships', 'scoring_settings',
    'weekly_matchups', 'weekly_lineups', 'player_weekly_stats',
    'trades', 'waiver_transactions', 'draft_picks',
    'league_messages', 'league_settings'
  );

-- Should return 11 rows
```

---

## Example Workflows

### Creating a League

```sql
-- 1. Create league
INSERT INTO leagues (name, commissioner_id, season, max_teams, league_type)
VALUES ('Legends League', 'user123', 2025, 12, 'h2h_points')
RETURNING id;

-- 2. Add teams to league
INSERT INTO league_memberships (league_id, team_id, draft_position, faab_budget)
VALUES 
  (1, 1, 1, 100),
  (1, 2, 2, 100),
  -- ... add all 12 teams
  (1, 12, 12, 100);

-- 3. Scoring settings and league settings auto-created by triggers
```

### Setting Weekly Lineups

```sql
-- User sets their lineup for week 3, matchup 25
INSERT INTO weekly_lineups (
  matchup_id, team_id, week_number,
  pg_player_id, sg_player_id, sf_player_id, pf_player_id, c_player_id,
  g_player_id, f_player_id, util1_player_id, util2_player_id,
  bench_player_ids
) VALUES (
  25, 1, 3,
  'jamesle01', 'davis01', 'murraj01', 'jokicni01', 'embiijo01',
  'doncalu01', 'tatumja01', 'bookede01', 'georgpa01',
  '["curryst01", "durank01"]'::jsonb
);

-- Lock the lineup
UPDATE weekly_lineups
SET is_locked = TRUE, locked_at = NOW()
WHERE id = (
  SELECT id FROM weekly_lineups WHERE team_id = 1 AND week_number = 3
);
```

### Processing Matchups

```sql
-- At end of week, finalize matchup
SELECT update_matchup_results(25);

-- This automatically:
-- 1. Calculates team1_score and team2_score
-- 2. Determines winner
-- 3. Updates standings (wins/losses/ties)
-- 4. Updates points_for and points_against
```

### Making Trades

```sql
-- Propose trade
INSERT INTO trades (
  league_id, season, team1_id, team2_id,
  team1_players, team2_players, proposed_by
) VALUES (
  1, 2025, 1, 2,
  '["jamesle01", "murraj01"]'::jsonb,
  '["doncalu01", "tatumja01"]'::jsonb,
  1  -- Team 1 proposes
);

-- Accept trade
UPDATE trades
SET 
  status = 'accepted',
  responded_at = NOW(),
  processed_at = NOW()
WHERE id = 123;
```

### Waiver Transactions

```sql
-- Add player via FAAB
INSERT INTO waiver_transactions (
  league_id, team_id, week_number,
  action_type, player_added_id, faab_bid, status
) VALUES (
  1, 3, 5,
  'add', 'brookdobr01', 25, 'pending'
);

-- Process waivers at deadline
SELECT process_waiver_transactions(1, 5);

-- Update team budget if successful
UPDATE league_memberships
SET faab_budget = faab_budget - 25
WHERE id = 3
  AND id IN (
    SELECT team_id FROM waiver_transactions WHERE id = NEW.id AND status = 'successful'
  );
```

---

## Key Constraints

### Data Integrity
- One team per league per season (unique constraint)
- Starting lineup must fill all 9 required positions
- No duplicate players in starting lineup (trigger check)
- Matchup teams must be different
- Trade teams must be different

### Business Rules
- Roster size limited to configured size (13 default)
- Lineups can only lock if not already locked
- Matchups move through workflow: upcoming → locked → in_progress → final
- Trades follow workflow: proposed → accepted/rejected → completed
- Waivers process by league-specific rules (FAAB vs priority)

---

## Performance Considerations

### Indexes
All tables have strategic indexes on:
- Foreign keys (league_id, team_id, player_id)
- Common query filters (status, week_number, season)
- Join columns for matchup queries
- Sort columns (wins, losses, fantasy_points)

### Query Optimization
```sql
-- Fast: Get league with all teams and standings
SELECT l.*, 
       ARRAY_AGG(
         json_build_object(
           'team_id', lm.id,
           'name', ft.name,
           'wins', lm.wins,
           'losses', lm.losses
         )
       ) AS teams
FROM leagues l
JOIN league_memberships lm ON l.id = lm.league_id
JOIN fantasy_teams ft ON lm.team_id = ft.id
WHERE l.id = 1
GROUP BY l.id;

-- Fast: Get matchup with both lineups
SELECT 
  wm.*,
  json_build_object(
    'team1', wl1.total_points,
    'team2', wl2.total_points
  ) AS scores
FROM weekly_matchups wm
LEFT JOIN weekly_lineups wl1 ON wm.id = wl1.matchup_id AND wm.team1_id = wl1.team_id
LEFT JOIN weekly_lineups wl2 ON wm.id = wl2.matchup_id AND wm.team2_id = wl2.team_id
WHERE wm.id = 25;
```

---

## Next Steps

After creating the schema:

1. **TypeScript Integration**
   - Create Drizzle schema definitions in `src/lib/db/schema/league.ts`
   - Add Zod validation schemas
   - Create API functions

2. **UI Components**
   - League creation flow
   - Team management dashboard
   - Weekly lineup interface
   - Matchup display page
   - Standings view

3. **API Endpoints**
   - `/api/league/create`
   - `/api/league/lineup`
   - `/api/league/matchup`
   - `/api/league/trade`
   - `/api/league/waiver`

4. **Automation**
   - Weekly matchup calculations
   - Waiver processing cron job
   - Lineup scoring updates
   - Playoff bracket generation

---

## Support

For questions or issues:
1. Review this documentation
2. Check the SQL comments in the schema files
3. See example workflows above
4. Check `STACK_AUTH_INTEGRATION.md` for auth setup

---

**Last Updated:** 2025-01-XX
**Schema Version:** 1.0.0

