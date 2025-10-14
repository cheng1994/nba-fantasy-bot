# Fantasy Teams Feature

This module provides functionality for managing fantasy basketball teams with NBA players.

## Overview

The fantasy teams system allows users to:
- Create and manage fantasy teams
- Build rosters with up to 13 players
- Assign players to specific positions
- Handle players with multiple position eligibility
- Validate roster requirements

## Database Schema

### Tables

#### `fantasy_teams`
Stores fantasy team information for each user.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Team name |
| owner | VARCHAR(100) | User identifier |
| season | INTEGER | NBA season year |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Constraints:**
- Unique constraint on (owner, season) - one team per user per season

#### `team_rosters`
Stores the 13-player roster for each fantasy team.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| team_id | INTEGER | Foreign key to fantasy_teams |
| player_id | VARCHAR(20) | Player identifier (links to nba_stats) |
| designated_position | VARCHAR(10) | Position slot (PG, SG, SF, PF, C, G, F, UTIL, BENCH) |
| eligible_positions | TEXT | Comma-separated eligible positions (e.g., "PG,SG") |
| roster_order | INTEGER | Display order in roster |
| added_at | TIMESTAMP | When player was added |

**Constraints:**
- Foreign key to fantasy_teams with CASCADE delete
- Unique constraint on (team_id, player_id) - player can only be on team once
- Check constraint: max 13 players per team (enforced by trigger)

## Roster Positions

### Required Positions (6)
Each team must fill these positions:
- **PG** - Point Guard
- **SG** - Shooting Guard
- **SF** - Small Forward
- **PF** - Power Forward
- **C** - Center
- **G** - Guard (any guard position)

### Additional Positions (7)
Remaining roster spots can be filled with:
- **F** - Forward (any forward position)
- **UTIL** - Utility (any position)
- **BENCH** - Bench players

### Total: 13 players per team

## Player Position Eligibility

Players can have multiple position eligibilities stored in the `eligible_positions` field:

Examples:
- Single position: `"PG"`
- Dual position: `"PG,SG"` or `"SF,PF"`
- Multi-position: `"PG,SG,SF"`

This allows flexible roster management where a player eligible for multiple positions can be slotted into any of their eligible position slots.

## Available Actions

### Team Management

#### `createFantasyTeam(params: CreateFantasyTeamParams)`
Creates a new fantasy team.

```typescript
const team = await createFantasyTeam({
  name: "My Dream Team",
  owner: "user123",
  season: 2024
});
```

#### `getFantasyTeam(teamId: number)`
Gets a team with full roster details including player stats.

```typescript
const team = await getFantasyTeam(1);
// Returns: { id, name, owner, season, roster: [...] }
```

#### `getFantasyTeamsByOwner(owner: string, season?: number)`
Gets all teams for a specific owner.

```typescript
const teams = await getFantasyTeamsByOwner("user123", 2024);
```

#### `deleteFantasyTeam(teamId: number)`
Deletes a team and all its roster entries.

```typescript
await deleteFantasyTeam(1);
```

### Roster Management

#### `addPlayerToRoster(params: AddPlayerToRosterParams)`
Adds a player to a team roster.

```typescript
const rosterSpot = await addPlayerToRoster({
  teamId: 1,
  playerId: "jamesle01",
  designatedPosition: "PG",
  eligiblePositions: "PG,SG",
  rosterOrder: 0
});
```

**Validations:**
- Team must have < 13 players
- Player cannot already be on the team

#### `removePlayerFromRoster(rosterSpotId: number)`
Removes a player from the roster.

```typescript
await removePlayerFromRoster(5);
```

#### `updateRosterSpot(params: UpdateRosterSpotParams)`
Updates a roster spot (position or order).

```typescript
const updated = await updateRosterSpot({
  id: 5,
  designatedPosition: "G",
  rosterOrder: 2
});
```

#### `getTeamRoster(teamId: number)`
Gets all roster spots for a team.

```typescript
const roster = await getTeamRoster(1);
```

### Utility Functions

#### `getAvailablePlayers(teamId: number, season: number, limit?: number)`
Gets players not on a specific team.

```typescript
const available = await getAvailablePlayers(1, 2024, 100);
```

#### `validateRosterPositions(teamId: number)`
Validates that all required positions are filled.

```typescript
const validation = await validateRosterPositions(1);
// Returns: {
//   isValid: boolean,
//   missingPositions: string[],
//   rosterCount: number,
//   hasFullRoster: boolean
// }
```

## Setup Instructions

### 1. Run SQL Migration

Execute the SQL migration to create the tables:

```bash
psql $DATABASE_URL -f sql/create_fantasy_teams_tables.sql
```

Or use your preferred database management tool to run the SQL file.

### 2. Import in Your Code

```typescript
import {
  createFantasyTeam,
  addPlayerToRoster,
  getFantasyTeam,
  // ... other functions
} from '@/lib/actions/fantasy-teams';
```

### 3. Use in Server Actions or API Routes

```typescript
// In a server action or API route
'use server';

export async function createTeam(formData: FormData) {
  const team = await createFantasyTeam({
    name: formData.get('name') as string,
    owner: 'user123', // Get from auth session
    season: 2024
  });
  
  return team;
}
```

## Example Workflow

### Creating a Full Fantasy Team

```typescript
// 1. Create the team
const team = await createFantasyTeam({
  name: "Lakers Fan Squad",
  owner: "user123",
  season: 2024
});

// 2. Add players for required positions
await addPlayerToRoster({
  teamId: team.id,
  playerId: "curryst01",
  designatedPosition: "PG",
  eligiblePositions: "PG,SG",
  rosterOrder: 0
});

await addPlayerToRoster({
  teamId: team.id,
  playerId: "hardeja01",
  designatedPosition: "SG",
  eligiblePositions: "SG,SF",
  rosterOrder: 1
});

await addPlayerToRoster({
  teamId: team.id,
  playerId: "jamesle01",
  designatedPosition: "SF",
  eligiblePositions: "SF,PF",
  rosterOrder: 2
});

await addPlayerToRoster({
  teamId: team.id,
  playerId: "davisan02",
  designatedPosition: "PF",
  eligiblePositions: "PF,C",
  rosterOrder: 3
});

await addPlayerToRoster({
  teamId: team.id,
  playerId: "embiijo01",
  designatedPosition: "C",
  eligiblePositions: "C",
  rosterOrder: 4
});

await addPlayerToRoster({
  teamId: team.id,
  playerId: "lillada01",
  designatedPosition: "G",
  eligiblePositions: "PG,SG",
  rosterOrder: 5
});

// 3. Fill remaining spots (F, UTIL, BENCH)
// ... add 7 more players

// 4. Validate roster
const validation = await validateRosterPositions(team.id);
console.log('Roster valid:', validation.isValid);
console.log('Missing positions:', validation.missingPositions);
```

## Database Triggers

### Roster Size Enforcement
A database trigger automatically prevents adding more than 13 players to a team:

```sql
CREATE TRIGGER check_team_roster_size
    BEFORE INSERT ON team_rosters
    FOR EACH ROW
    EXECUTE FUNCTION check_roster_size();
```

### Updated At Timestamp
Automatically updates the `updated_at` timestamp on fantasy_teams:

```sql
CREATE TRIGGER update_fantasy_teams_updated_at 
    BEFORE UPDATE ON fantasy_teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Type Definitions

All types are exported from the schema:

```typescript
import type {
  FantasyTeam,
  TeamRoster,
  CreateFantasyTeamParams,
  AddPlayerToRosterParams,
  UpdateRosterSpotParams,
  Position
} from '@/lib/db/schema/fantasy-teams';
```

## Performance Considerations

### Indexes
The following indexes are created for optimal query performance:
- `idx_fantasy_teams_owner` - Fast lookups by owner
- `idx_fantasy_teams_season` - Fast lookups by season
- `idx_team_rosters_team_id` - Fast roster queries
- `idx_team_rosters_player_id` - Fast player lookups
- `idx_team_rosters_designated_position` - Position-based queries

### Query Optimization
- Use `getFantasyTeam()` for team + roster in one query (includes JOIN with nba_stats)
- Use `getTeamRoster()` for roster-only queries
- `getAvailablePlayers()` efficiently excludes rostered players

## Future Enhancements

Potential additions:
- Draft order tracking
- Trade system between teams
- Waiver wire priority
- Team statistics aggregation
- Head-to-head matchups
- League table for multiple teams
- Player injury status integration
- Lineup optimization recommendations

