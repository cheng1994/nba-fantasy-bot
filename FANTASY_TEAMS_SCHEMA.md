# Fantasy Teams Database Schema

## Entity Relationship Diagram

```
┌─────────────────────────────────┐
│       fantasy_teams             │
├─────────────────────────────────┤
│ id (PK)                         │
│ name                            │
│ owner                           │
│ season                          │
│ created_at                      │
│ updated_at                      │
│                                 │
│ UNIQUE(owner, season)           │
└──────────────┬──────────────────┘
               │
               │ 1:N (ON DELETE CASCADE)
               │
               ▼
┌─────────────────────────────────┐
│       team_rosters              │
├─────────────────────────────────┤
│ id (PK)                         │
│ team_id (FK) ────────────────┐  │
│ player_id ───────────────────┼──┼─────┐
│ designated_position          │  │     │
│ eligible_positions           │  │     │
│ roster_order                 │  │     │
│ added_at                     │  │     │
│                              │  │     │
│ UNIQUE(team_id, player_id)   │  │     │
│ MAX 13 players (trigger)     │  │     │
└──────────────────────────────┘  │     │
                                  │     │
                                  │     │ Links via player_id
                                  │     │
                                  │     ▼
                                  │  ┌─────────────────────────────────┐
                                  │  │       nba_stats                 │
                                  │  ├─────────────────────────────────┤
                                  │  │ id (PK)                         │
                                  └──│ player_id                       │
                                     │ player                          │
                                     │ team                            │
                                     │ position                        │
                                     │ fpts_total                      │
                                     │ fpts                            │
                                     │ projected_fpts_total            │
                                     │ ... (stats)                     │
                                     └─────────────────────────────────┘
```

## Table Details

### fantasy_teams
**Purpose**: Stores each user's fantasy team
**Constraints**:
- Primary key: `id`
- Unique: `(owner, season)` - one team per user per season
- Trigger: Auto-updates `updated_at` timestamp

**Columns**:
- `id` - Serial, auto-incrementing
- `name` - Team name (max 100 chars)
- `owner` - User identifier (max 100 chars)
- `season` - NBA season year (e.g., 2024)
- `created_at` - Creation timestamp
- `updated_at` - Last modification timestamp

### team_rosters
**Purpose**: Stores the 13 players on each team
**Constraints**:
- Primary key: `id`
- Foreign key: `team_id` → `fantasy_teams.id` (CASCADE DELETE)
- Unique: `(team_id, player_id)` - no duplicate players per team
- Trigger: Prevents > 13 players per team

**Columns**:
- `id` - Serial, auto-incrementing
- `team_id` - Links to fantasy_teams
- `player_id` - Links to nba_stats (VARCHAR, not FK for flexibility)
- `designated_position` - Where player is slotted on team
  - Valid: PG, SG, SF, PF, C, G, F, UTIL, BENCH
- `eligible_positions` - Positions player can play (comma-separated)
  - Examples: "PG,SG", "SF,PF", "C"
- `roster_order` - Display order (0-12)
- `added_at` - When player was added

### nba_stats (existing)
**Purpose**: NBA player statistics
**Link**: `player_id` field used by `team_rosters`

## Position Requirements

### Required (6 positions)
Each team must have exactly 1 player in each:
1. **PG** - Point Guard
2. **SG** - Shooting Guard
3. **SF** - Small Forward
4. **PF** - Power Forward
5. **C** - Center
6. **G** - Guard (any guard position)

### Flexible (7 positions)
Remaining roster spots:
7. **F** - Forward (any forward position)
8-9. **UTIL** - Utility (any position)
10-13. **BENCH** - Bench (any position)

**Total: 13 players**

## Multi-Position Example

A player like James Harden who can play both guard positions:

```typescript
{
  playerId: 'hardeja01',
  designatedPosition: 'SG',      // Currently slotted at SG
  eligiblePositions: 'PG,SG',    // Can play PG or SG
}
```

This player could fill:
- The SG requirement (as shown)
- The PG requirement (if moved)
- The G requirement (guard position)
- UTIL or BENCH slots

## Indexes

For optimal query performance:

```sql
-- Fast team lookups
idx_fantasy_teams_owner ON fantasy_teams(owner)
idx_fantasy_teams_season ON fantasy_teams(season)

-- Fast roster queries
idx_team_rosters_team_id ON team_rosters(team_id)
idx_team_rosters_player_id ON team_rosters(player_id)
idx_team_rosters_designated_position ON team_rosters(designated_position)

-- Fast player lookups (existing)
idx_nba_stats_player_id ON nba_stats(player_id)
```

## Database Triggers

### 1. Update Timestamp
Auto-updates `updated_at` on fantasy_teams:
```sql
CREATE TRIGGER update_fantasy_teams_updated_at 
    BEFORE UPDATE ON fantasy_teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Roster Size Limit
Prevents adding more than 13 players:
```sql
CREATE TRIGGER check_team_roster_size
    BEFORE INSERT ON team_rosters
    FOR EACH ROW
    EXECUTE FUNCTION check_roster_size();
```

## Query Examples

### Get team with full roster and player stats
```sql
SELECT 
  t.*,
  r.id as roster_id,
  r.designated_position,
  r.eligible_positions,
  n.player,
  n.team as nba_team,
  n.fpts_total,
  n.fpts
FROM fantasy_teams t
LEFT JOIN team_rosters r ON t.id = r.team_id
LEFT JOIN nba_stats n ON r.player_id = n.player_id
WHERE t.id = 1
ORDER BY r.roster_order;
```

### Check required positions filled
```sql
SELECT 
  designated_position,
  COUNT(*) as count
FROM team_rosters
WHERE team_id = 1
  AND designated_position IN ('PG', 'SG', 'SF', 'PF', 'C', 'G')
GROUP BY designated_position;
```

### Get available players not on team
```sql
SELECT *
FROM nba_stats
WHERE season = 2024
  AND player_id NOT IN (
    SELECT player_id 
    FROM team_rosters 
    WHERE team_id = 1
  )
ORDER BY fpts_total DESC
LIMIT 100;
```

## Data Flow

```
User Action → Server Action → Database → Response

1. Create Team
   createFantasyTeam() → INSERT fantasy_teams → return team

2. Add Player
   addPlayerToRoster() → 
     - Check roster count (< 13)
     - Check player not already on team
     - INSERT team_rosters → return roster_spot

3. Get Team
   getFantasyTeam() → 
     - SELECT fantasy_teams
     - JOIN team_rosters
     - JOIN nba_stats → return team with roster

4. Validate
   validateRosterPositions() →
     - SELECT team_rosters
     - Check required positions
     - return validation result
```

## Type Safety (TypeScript)

All database operations are type-safe using Drizzle ORM:

```typescript
// Schema-inferred types
type FantasyTeam = typeof fantasyTeams.$inferSelect
type TeamRoster = typeof teamRosters.$inferSelect

// Zod validation schemas
createFantasyTeamSchema.parse(params)  // Runtime validation
addPlayerToRosterSchema.parse(params)   // Runtime validation

// Valid position enum
type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'G' | 'F' | 'UTIL' | 'BENCH'
```

## Migration Path

1. **Create tables**: Run `sql/create_fantasy_teams_tables.sql`
2. **No data migration needed**: New tables, no existing data
3. **Backward compatible**: Doesn't modify existing tables
4. **Safe rollback**: Can drop tables without affecting nba_stats

## Performance Characteristics

- **Team creation**: O(1) - single insert
- **Add player**: O(1) - single insert with constraint check
- **Get team with roster**: O(n) where n = roster size (max 13)
- **Validate positions**: O(n) where n = roster size (max 13)
- **Available players**: O(m) where m = total players in season

All queries use indexes for optimal performance.

