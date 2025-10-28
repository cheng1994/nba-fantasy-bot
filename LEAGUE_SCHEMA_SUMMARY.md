# League Database Schema Summary

## Overview

Complete database schema for H2H fantasy basketball leagues with Sleeper-style lineup locking.

## New Files Created

### 1. `sql/create_league_tables.sql`
**Purpose:** Core schema with 11 league tables

**Tables:**
- `leagues` - League management and configuration
- `league_memberships` - Team participation and standings
- `scoring_settings` - Customizable scoring rules
- `weekly_matchups` - H2H schedule and results
- `weekly_lineups` - **Sleeper lock-in feature** (9 starters + bench)
- `player_weekly_stats` - Aggregated weekly stats
- `trades` - Player trading with review system
- `waiver_transactions` - FAAB and waiver wire management
- `draft_picks` - Draft history and keeper support
- `league_messages` - League chat
- `league_settings` - Advanced configuration

### 2. `sql/league_helper_functions.sql`
**Purpose:** Database functions for common operations

**Functions:**
- `calculate_fantasy_points()` - Score calculation
- `update_matchup_results()` - Finalize matchups & update standings
- `can_lock_lineup()` - Validate lineup locking permissions
- `validate_lineup_for_lock()` - Check required positions
- `create_matchup_schedule()` - Auto-generate round-robin schedule
- `process_waiver_transactions()` - Process waivers by league rules

**Triggers:**
- Duplicate player check in lineups
- Auto-create scoring_settings when league created
- Auto-create league_settings when league created

### 3. `sql/README_LEAGUE_SCHEMA.md`
**Purpose:** Complete documentation

**Sections:**
- Table descriptions with key fields
- Helper function usage examples
- Migration steps
- Example workflows (create league, set lineup, process matchup, trade, waivers)
- Performance considerations
- Next steps for implementation

### 4. `sql/setup_league_schema.sh`
**Purpose:** One-command schema setup

**Usage:**
```bash
export DATABASE_URL="postgresql://..."
./sql/setup_league_schema.sh
```

## Key Features Enabled

### ✅ Sleeper Lock-In System
- Lock lineups at game time or daily
- 9 required starting positions
- Bench players tracked in JSON
- `is_locked` boolean + `locked_at` timestamp

### ✅ H2H Points League
- Weekly matchups between teams
- Automatic score calculation
- Standings tracking (W-L-T)
- Points for/against tracking

### ✅ Full League Management
- Customizable scoring (ESPN standard included)
- Multiple waiver systems (FAAB, rolling, reverse standings)
- Trade system with review period and veto
- Draft history with keeper support
- League chat/messaging

### ✅ Playoff System
- Configurable playoff teams
- Playoff bracket support
- Consolation bracket option
- Multiple playoff formats

## Integration with Existing Schema

### Uses Existing Tables
- `fantasy_teams` - User teams
- `team_rosters` - 13-player rosters  
- `nba_stats` - Player statistics
- `player_wishlist` - Draft preferences

### Adds League Structure
- Teams join leagues via `league_memberships`
- Each league has custom `scoring_settings`
- Matchups link teams in H2H competition
- Lineups populate matchups with locked starters

## Quick Start

### 1. Run Schema Creation
```bash
# Option A: Use the setup script
export DATABASE_URL="postgresql://user:pass@host:port/db"
./sql/setup_league_schema.sh

# Option B: Run SQL files manually
psql $DATABASE_URL -f sql/create_league_tables.sql
psql $DATABASE_URL -f sql/league_helper_functions.sql
```

### 2. Verify Installation
```sql
-- Check tables created
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'leagues', 'league_memberships', 'scoring_settings',
    'weekly_matchups', 'weekly_lineups', 'player_weekly_stats',
    'trades', 'waiver_transactions', 'draft_picks',
    'league_messages', 'league_settings'
  );
-- Should return 11
```

### 3. Test Schema
```sql
-- Create a test league
INSERT INTO leagues (name, commissioner_id, season, max_teams)
VALUES ('Test League', 'test_user', 2025, 12)
RETURNING id;

-- Verify settings auto-created
SELECT * FROM scoring_settings WHERE league_id = 1;
SELECT * FROM league_settings WHERE league_id = 1;

-- Clean up
DELETE FROM leagues WHERE id = 1;
```

## Next Implementation Steps

### 1. TypeScript/Drizzle Schema
Create `src/lib/db/schema/league.ts` with:
- Table definitions
- Zod validation schemas  
- Type exports
- Insert/select/update helpers

### 2. API Endpoints
Create REST endpoints in `src/app/api/league/`:
- `POST /api/league` - Create league
- `GET /api/league/[id]` - Get league details
- `POST /api/league/[id]/lineup` - Set lineup
- `POST /api/league/[id]/matchup` - Get matchup
- `POST /api/league/[id]/trade` - Propose trade
- `POST /api/league/[id]/waiver` - Add/drop players

### 3. UI Components
Build React components:
- `LeagueDashboard` - Standings, matchups, upcoming
- `LineupManager` - Drag-drop lineup builder
- `MatchupView` - Head-to-head display
- `TradeInterface` - Trade proposal UI
- `WaiverWire` - Browse available players
- `LeagueChat` - Communication

### 4. Background Jobs
Set up automation:
- Weekly matchup calculations (trigger `update_matchup_results()`)
- Waiver processing (trigger `process_waiver_transactions()`)
- Lineup lock enforcement
- Stat aggregation from NBA API

### 5. AI Integration
Extend AI chat to support:
- "Show me my matchup this week"
- "Should I start Player X or Player Y?"
- "Analyze my trade offer"
- "Who should I pick up from waivers?"
- "What's my best lineup this week?"

## Architecture Diagram

```
┌─────────────────┐
│  Stack Auth     │
│  (Users)        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  fantasy_teams          │
│  - User's teams         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  league_memberships     │ ◄───┐
│  - Join leagues         │     │
│  - Track standings      │     │
└────────┬────────────────┘     │
         │                       │
         ▼                       │
┌─────────────────────────┐     │
│  leagues                │─────┘
│  - Configuration        │
│  - Status               │
└────┬──────────┬─────────┘
     │          │
     ▼          ▼
┌─────────────────┐  ┌──────────────────┐
│ weekly_matchups │  │ scoring_settings │
│ - Schedule       │  │ - Points per stat│
│ - Results        │  └──────────────────┘
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ weekly_lineups  │ ◄─── Sleeper Lock-In
│ - 9 starters    │      - is_locked
│ - Bench (JSON)  │      - locked_at
│ - Total points  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐      ┌──────────────────┐
│ player_weekly_  │ ◄────│  nba_stats       │
│     stats       │      │ - Season stats   │
│ - Week totals   │      │ - Projections    │
│ - Fantasy pts   │      └──────────────────┘
└─────────────────┘

Additional tables:
- trades (player trading)
- waiver_transactions (FAAB/waivers)
- draft_picks (draft history)
- league_messages (chat)
- league_settings (advanced config)
```

## File Sizes & Stats

- `create_league_tables.sql`: ~600 lines
- `league_helper_functions.sql`: ~400 lines  
- `README_LEAGUE_SCHEMA.md`: ~900 lines
- **Total**: ~1900 lines of SQL + documentation

## Database Size Estimate

For a 12-team league:
- `leagues`: 1 row
- `league_memberships`: 12 rows
- `weekly_matchups`: ~120 rows (10 weeks × 12 teams / 2)
- `weekly_lineups`: ~240 rows (2 per matchup)
- `player_weekly_stats`: ~60,000 rows (500 players × 20 weeks × 6 seasons)
- `trades`: ~10-20 per league per season
- `waiver_transactions`: ~50-100 per league per season

**Total**: ~61,000 rows per league

## Support & Maintenance

### Schema Changes
If you need to modify the schema:
1. Create a new SQL file: `sql/migrate_X_description.sql`
2. Document changes in the file header
3. Test on a copy of production data
4. Run migration during maintenance window

### Performance Monitoring
Key queries to monitor:
```sql
-- Large lineup calculations
SELECT COUNT(*) FROM weekly_lineups 
WHERE matchup_id IN (SELECT id FROM weekly_matchups WHERE status = 'final');

-- Active trades
SELECT COUNT(*) FROM trades WHERE status IN ('proposed', 'accepted');

-- Pending waivers
SELECT COUNT(*) FROM waiver_transactions WHERE status = 'pending';
```

---

## Summary

✅ **11 new tables** for complete league functionality  
✅ **Sleeper-style lineup locking** with 9 required positions  
✅ **H2H matchups** with automatic standings  
✅ **Customizable scoring** (ESPN standard included)  
✅ **FAAB waivers** and rolling priority support  
✅ **Trade system** with review and veto  
✅ **Helper functions** for common operations  
✅ **Complete documentation** with examples  
✅ **One-command setup** script

**Ready for TypeScript integration and UI development!** 🚀

