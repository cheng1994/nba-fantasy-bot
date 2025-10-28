# League Management Documentation

## Overview

Complete TypeScript implementation for H2H fantasy basketball leagues with Sleeper-style lineup locking features.

## Files Created

### 1. `src/lib/db/schema/league.ts`
**Purpose:** Drizzle ORM schema definitions for all 11 league tables

**Features:**
- Full type safety with Drizzle
- Zod validation schemas
- TypeScript type exports
- Foreign key relationships

**Tables Defined:**
- `leagues` - League configuration
- `leagueMemberships` - Team participation
- `scoringSettings` - Custom scoring rules
- `weeklyMatchups` - H2H matchups
- `weeklyLineups` - **Sleeper lock-in feature**
- `playerWeeklyStats` - Weekly aggregates
- `trades` - Trade system
- `waiverTransactions` - FAAB/waivers
- `draftPicks` - Draft history
- `leagueMessages` - League chat
- `leagueSettings` - Advanced config

### 2. `src/lib/actions/league.ts`
**Purpose:** Server actions for league operations

**Functions:**
- `createLeague()` - Create new league
- `getLeague()` - Get league details with teams/standings
- `joinLeague()` - Join league with team
- `getLeagueStandings()` - Get current standings
- `getWeeklyMatchup()` - Get matchup with lineups
- `setWeeklyLineup()` - Set lineup
- `lockLineup()` - **Lock lineup (Sleeper feature)**
- `getTeamMatchup()` - Get team's matchup for week
- `proposeTrade()` - Propose player trade
- `acceptTrade()` - Accept trade
- `addWaiverClaim()` - Add waiver claim
- `getPendingTrades()` - Get pending trades
- `getUserLeagues()` - Get user's leagues

### 3. API Endpoints

#### `src/app/api/league/route.ts`
- `POST /api/league` - Create league
- `GET /api/league?leagueId=X` - Get league details
- `GET /api/league?userId=X` - Get user's leagues
- `PUT /api/league` - Join league

#### `src/app/api/league/[leagueId]/standings/route.ts`
- `GET /api/league/[leagueId]/standings` - Get standings

#### `src/app/api/league/lineup/route.ts`
- `POST /api/league/lineup` - Set lineup
- `POST /api/league/lineup` (action: 'lock') - Lock lineup

#### `src/app/api/league/matchup/[matchupId]/route.ts`
- `GET /api/league/matchup/[matchupId]` - Get matchup details

#### `src/app/api/league/trade/route.ts`
- `POST /api/league/trade` - Propose trade
- `POST /api/league/trade` (action: 'accept') - Accept trade
- `GET /api/league/trade?teamId=X` - Get pending trades

#### `src/app/api/league/waiver/route.ts`
- `POST /api/league/waiver` - Add waiver claim

## Usage Examples

### Creating a League

```typescript
// Create league via API
const response = await fetch('/api/league', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Legends League',
        season: 2025,
        leagueType: 'h2h_points',
        maxTeams: 12,
        lineupLockTime: 'game_time',
        waiverType: 'faab',
    }),
});

const league = await response.json();
```

### Setting a Lineup

```typescript
// Set your weekly lineup
const response = await fetch('/api/league/lineup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        matchupId: 25,
        teamId: 1,
        weekNumber: 3,
        pgPlayerId: 'jamesle01',
        sgPlayerId: 'davis01',
        sfPlayerId: 'murraj01',
        pfPlayerId: 'jokicni01',
        cPlayerId: 'embiijo01',
        gPlayerId: 'doncalu01',
        fPlayerId: 'tatumja01',
        util1PlayerId: 'bookede01',
        util2PlayerId: 'georgpa01',
        benchPlayerIds: ['curryst01', 'durank01'],
    }),
});
```

### Locking Your Lineup (Sleeper Feature)

```typescript
// Lock lineup before game time
const response = await fetch('/api/league/lineup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        action: 'lock',
        lineupId: 123,
    }),
});

if (response.ok) {
    console.log('Lineup locked!');
}
```

### Proposing a Trade

```typescript
// Propose trade
const response = await fetch('/api/league/trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        leagueId: 1,
        season: 2025,
        team1Id: 1,
        team2Id: 2,
        team1Players: ['jamesle01', 'murraj01'],
        team2Players: ['doncalu01', 'tatumja01'],
        proposedBy: 1, // Team 1 proposes
    }),
});
```

### Joining a League

```typescript
// Join league with a team
const response = await fetch('/api/league', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        leagueId: 1,
        teamId: 5,
        draftPosition: 3,
    }),
});
```

### Getting Matchup Details

```typescript
// Get matchup with both teams' lineups
const response = await fetch('/api/league/matchup/25');
const matchup = await response.json();

console.log('Team 1 Score:', matchup.team1Score);
console.log('Team 2 Score:', matchup.team2Score);
console.log('Team 1 Lineup:', matchup.team1Lineup);
console.log('Team 2 Lineup:', matchup.team2Lineup);
```

### Adding Waiver Claims

```typescript
// Claim a player via FAAB
const response = await fetch('/api/league/waiver', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        leagueId: 1,
        teamId: 1,
        weekNumber: 5,
        actionType: 'add',
        playerAddedId: 'brookdobr01',
        faabBid: 25,
    }),
});
```

## Key Features

### ✅ Sleeper Lock-In System
- Lock lineups at game time or daily
- `isLocked` boolean tracks lock status
- `lockedAt` timestamp recorded
- Prevents lineup changes after lock

### ✅ H2H Matchups
- Weekly H2H matchups
- Automatic score calculation
- Standings tracking (W-L-T)
- Points for/against totals

### ✅ Flexible Scoring
- Default ESPN scoring included
- Customizable points per stat
- Bonus scoring (double-doubles, triple-doubles)
- Field goal penalties

### ✅ Multiple Waiver Systems
- FAAB (Free Agent Auction Budget)
- Rolling priority
- Reverse standings priority

### ✅ Trade System
- Propose/reject/accept workflow
- Veto system support
- Trade deadline enforcement

## Integration with Stack Auth

All endpoints use Stack Auth for authentication:

```typescript
import { auth } from '@/stack/auth';

// Get session
const session = await auth.api.getSession({ headers: req.headers });

// Check authorization
if (!session?.session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Use userId
const userId = session.session.user.id;
```

## Type Safety

All operations are fully type-safe:

```typescript
import type { League, WeeklyLineup, Trade } from '@/lib/db/schema/league';

// Fully typed
const league: League = await getLeague(1);
const lineup: WeeklyLineup = await setWeeklyLineup(params);
```

## Error Handling

All functions include comprehensive error handling:

```typescript
try {
    const result = await createLeague(params);
    return result;
} catch (error) {
    console.error('Error creating league:', error);
    if (error instanceof Error) {
        throw error; // Re-throw with message
    }
    throw new Error('Failed to create league');
}
```

## Next Steps

### 1. UI Components
Create React components:
- `LeagueDashboard` - Main league view
- `LineupManager` - Set weekly lineup
- `MatchupView` - Head-to-head display
- `TradeInterface` - Propose/accept trades
- `WaiverWire` - Browse available players

### 2. Background Jobs
Implement automation:
- Weekly matchup calculations
- Waiver processing
- Lineup scoring updates
- Playoff bracket generation

### 3. AI Integration
Add AI features:
- "Show me my matchup this week"
- "Who should I start?"
- "Analyze my trade offer"
- "Best waiver pickups this week"

## Testing

Test the endpoints:

```bash
# Create a league
curl -X POST http://localhost:3000/api/league \
  -H "Content-Type: application/json" \
  -d '{"name":"Test League","season":2025,"leagueType":"h2h_points","maxTeams":12}'

# Get league
curl http://localhost:3000/api/league?leagueId=1

# Get standings
curl http://localhost:3000/api/league/1/standings
```

## Database Setup

Before using these endpoints, run the SQL schema:

```bash
export DATABASE_URL="postgresql://..."
./sql/setup_league_schema.sh
```

## Performance Considerations

- Indexes on all foreign keys
- Indexes on commonly queried fields (week_number, status)
- Efficient joins with Drizzle ORM
- Prepared statement caching

## Security

- Stack Auth session validation
- User ownership checks
- League membership validation
- SQL injection prevention (Drizzle ORM)
- Type-safe parameters

---

**Ready for UI development!** 🚀

