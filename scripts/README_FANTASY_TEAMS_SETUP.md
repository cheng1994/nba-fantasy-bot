# Fantasy Teams Setup Guide

This guide explains the Fantasy Teams feature that has been added to the NBA Fantasy Bot project.

## Overview

The Fantasy Teams feature allows users to create and manage fantasy basketball teams with:
- **13 players per team** (roster limit enforced at database level)
- **Required positions**: PG, SG, SF, PF, C, G (6 positions)
- **Flexible positions**: F, UTIL, BENCH (7 additional spots)
- **Multi-position eligibility**: Players can be eligible for multiple positions

## What Was Created

### 1. Database Schema
**File**: `src/lib/db/schema/fantasy-teams.ts`

Two new tables:
- `fantasy_teams` - Stores team information (name, owner, season)
- `team_rosters` - Stores the 13-player roster with position assignments

Key features:
- Foreign key relationships with cascade delete
- Unique constraints to prevent duplicate entries
- Validation of roster size (max 13 players)
- Support for multi-position player eligibility

### 2. Database Migration
**File**: `sql/create_fantasy_teams_tables.sql`

SQL script to create:
- Tables with all constraints
- Indexes for optimal query performance
- Triggers for automatic timestamp updates
- Trigger to enforce 13-player roster limit
- Table comments for documentation

### 3. Server Actions
**File**: `src/lib/actions/fantasy-teams.ts`

Complete set of server actions for:
- Creating and deleting teams
- Adding/removing players from rosters
- Updating roster positions
- Querying teams and rosters
- Getting available players
- Validating roster completeness

### 4. Database Index Updates
**File**: `src/lib/db/index.ts`

Updated to export the new schema tables.

### 5. Documentation
**File**: `src/lib/actions/README_FANTASY_TEAMS.md`

Comprehensive documentation covering:
- Schema details
- Available actions
- Type definitions
- Example workflows
- Performance considerations

### 6. Setup Script
**File**: `scripts/setup_fantasy_teams.sh`

Bash script to easily set up the database tables.

### 7. Example Usage
**File**: `scripts/example_fantasy_team_usage.ts`

TypeScript example demonstrating:
- Creating a team
- Adding 13 players
- Validating roster
- Querying team data
- Managing roster positions

## Quick Start

### Step 1: Set Up Database Tables

Make sure your `DATABASE_URL` environment variable is set, then run:

```bash
./scripts/setup_fantasy_teams.sh
```

Or manually:

```bash
psql $DATABASE_URL -f sql/create_fantasy_teams_tables.sql
```

### Step 2: Use in Your Code

Import the actions:

```typescript
import {
  createFantasyTeam,
  addPlayerToRoster,
  getFantasyTeam,
  validateRosterPositions,
} from '@/lib/actions/fantasy-teams';
```

### Step 3: Create Your First Team

```typescript
// Create team
const team = await createFantasyTeam({
  name: 'My Team',
  owner: 'user123',
  season: 2024,
});

// Add a player
await addPlayerToRoster({
  teamId: team.id,
  playerId: 'curryst01', // Must exist in nba_stats table
  designatedPosition: 'PG',
  eligiblePositions: 'PG,SG', // Player can play PG or SG
  rosterOrder: 0,
});

// Validate roster
const validation = await validateRosterPositions(team.id);
console.log('Is valid:', validation.isValid);
console.log('Missing positions:', validation.missingPositions);
```

## Roster Structure

### Required Positions (Must have 1 of each)
1. **PG** - Point Guard
2. **SG** - Shooting Guard  
3. **SF** - Small Forward
4. **PF** - Power Forward
5. **C** - Center
6. **G** - Guard (any guard: PG or SG)

### Additional Positions (Fill remaining 7 spots)
7. **F** - Forward (any forward: SF or PF)
8-9. **UTIL** - Utility (any position)
10-13. **BENCH** - Bench players

**Total: 13 players**

## Multi-Position Support

The system supports players with multiple position eligibility:

```typescript
// Example: A guard who can play both PG and SG
eligiblePositions: "PG,SG"

// Example: A versatile forward
eligiblePositions: "SF,PF"

// Example: A big who can play both positions
eligiblePositions: "PF,C"
```

This allows flexible roster management where the same player could fill different position requirements.

## Database Validation

The database enforces several constraints:

1. **Roster Size**: Cannot exceed 13 players (trigger-enforced)
2. **Unique Players**: A player can only be on each team once
3. **Unique Owner/Season**: One team per owner per season
4. **Cascade Delete**: Deleting a team removes all its roster entries

## API Reference

### Team Management

| Function | Description |
|----------|-------------|
| `createFantasyTeam(params)` | Create a new team |
| `getFantasyTeam(teamId)` | Get team with full roster details |
| `getFantasyTeamsByOwner(owner, season?)` | Get all teams for an owner |
| `deleteFantasyTeam(teamId)` | Delete team and roster |

### Roster Management

| Function | Description |
|----------|-------------|
| `addPlayerToRoster(params)` | Add player to roster |
| `removePlayerFromRoster(rosterSpotId)` | Remove player from roster |
| `updateRosterSpot(params)` | Update position/order |
| `getTeamRoster(teamId)` | Get roster for a team |

### Utility Functions

| Function | Description |
|----------|-------------|
| `getAvailablePlayers(teamId, season, limit?)` | Get players not on team |
| `validateRosterPositions(teamId)` | Validate required positions filled |

## Testing the Feature

Run the example script:

```bash
# Make sure tsx is installed
npm install -g tsx

# Run example
tsx scripts/example_fantasy_team_usage.ts
```

This will:
1. Create a test team
2. Add 13 players to fill all positions
3. Display the full roster
4. Validate the roster
5. Demonstrate various queries

## Integration with Existing Features

The fantasy teams feature integrates with:

- **NBA Stats**: Links to players via `player_id` field
- **Database Schema**: Uses same Drizzle ORM patterns
- **Server Actions**: Follows same pattern as `nba-stats.ts` actions

## Performance Optimizations

Indexes created for fast queries:
- Owner lookups
- Season filtering
- Team roster queries
- Player searches
- Position-based queries

## Next Steps

Potential enhancements:
- Add UI components for team management
- Implement draft system
- Create trade functionality
- Add lineup optimization
- Build matchup system
- Track team performance over time

## File Structure Summary

```
nba-fantasy-bot/
├── src/
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema/
│   │   │   │   └── fantasy-teams.ts          # Database schema
│   │   │   └── index.ts                       # Updated exports
│   │   └── actions/
│   │       ├── fantasy-teams.ts               # Server actions
│   │       ├── README_FANTASY_TEAMS.md        # Full documentation
│   │       └── ...
├── sql/
│   └── create_fantasy_teams_tables.sql        # SQL migration
├── scripts/
│   ├── setup_fantasy_teams.sh                 # Setup script
│   ├── example_fantasy_team_usage.ts          # Example code
│   └── README_FANTASY_TEAMS_SETUP.md          # This file
```

## Troubleshooting

### "DATABASE_URL not set"
Make sure your environment variable is configured:
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

### "Player not found" when adding to roster
The `player_id` must exist in the `nba_stats` table. Make sure you've imported NBA stats first.

### "Team roster is full"
Teams are limited to 13 players. Remove a player before adding a new one.

### "Player already on team"
Each player can only be on a team once. The unique constraint prevents duplicates.

## Support

For questions or issues:
1. Check the main documentation: `src/lib/actions/README_FANTASY_TEAMS.md`
2. Review the example code: `scripts/example_fantasy_team_usage.ts`
3. Examine the schema: `src/lib/db/schema/fantasy-teams.ts`

## License

Same as the parent project.

