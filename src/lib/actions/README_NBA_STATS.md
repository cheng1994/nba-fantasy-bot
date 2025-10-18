# NBA Stats API Documentation

This document describes how to use the NBA Stats API and related functions.

## API Endpoint

### GET `/api/nba-stats`

Fetch NBA player statistics with various filters and options.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `season` | number | Filter by season (e.g., 2025) | - |
| `team` | string | Filter by team abbreviation (e.g., "LAL", "GSW") | - |
| `position` | string | Filter by position (PG, SG, SF, PF, C) | - |
| `drafted` | boolean | Filter by draft status | - |
| `limit` | number | Number of results (max 500) | 100 |
| `offset` | number | Offset for pagination | 0 |
| `orderBy` | string | Column to sort by | `fpts_total` |
| `orderDirection` | string | Sort direction (`asc` or `desc`) | `desc` |
| `playerId` | string | Get stats for specific player | - |
| `search` | string | Search players by name | - |
| `action` | string | Special actions: `teams` or `positions` | - |

#### Order By Options

- `fpts_total` - Total fantasy points
- `fpts` - Average fantasy points per game
- `points` - Total points
- `assists` - Total assists
- `rebounds` - Total rebounds
- `player` - Player name

#### Examples

**Get top 20 players by fantasy points:**
```
GET /api/nba-stats?limit=20
```

**Get available players (not drafted) for 2025 season:**
```
GET /api/nba-stats?season=2025&drafted=false&limit=50
```

**Get all point guards ordered by assists:**
```
GET /api/nba-stats?position=PG&orderBy=assists&limit=30
```

**Search for a player by name:**
```
GET /api/nba-stats?search=LeBron
```

**Get stats for specific player:**
```
GET /api/nba-stats?playerId=jamesle01&season=2025
```

**Get list of all teams:**
```
GET /api/nba-stats?action=teams
```

**Get list of all positions:**
```
GET /api/nba-stats?action=positions
```

**Get Lakers players:**
```
GET /api/nba-stats?team=LAL&limit=20
```

#### Response Format

```json
{
  "data": [
    {
      "id": 1,
      "season": 2025,
      "league": "NBA",
      "player": "LeBron James",
      "playerId": "jamesle01",
      "age": 40,
      "team": "LAL",
      "position": "SF",
      "fptsTotal": "2450.50",
      "fpts": "30.25",
      "games": 81,
      "gamesStarted": 81,
      "minutesPlayed": 2900,
      "points": 2050,
      "assists": 650,
      "totalRebounds": 550,
      "steals": 90,
      "blocks": 45,
      "drafted": false,
      // ... more stats
    }
  ],
  "count": 20,
  "filters": {
    "season": 2025,
    "drafted": false,
    "orderBy": "fpts_total"
  }
}
```

## Server Actions

You can also use server actions directly in your React components:

### `fetchNbaStats(filters)`

```typescript
import { fetchNbaStats } from '@/lib/actions/nba-stats';

const stats = await fetchNbaStats({
  season: 2025,
  drafted: false,
  limit: 20,
  orderBy: 'fpts_total',
  orderDirection: 'desc'
});
```

### `fetchPlayerStats(playerId, season?)`

```typescript
import { fetchPlayerStats } from '@/lib/actions/nba-stats';

const player = await fetchPlayerStats('jamesle01', 2025);
```

### `searchPlayers(searchTerm, limit?)`

```typescript
import { searchPlayers } from '@/lib/actions/nba-stats';

const results = await searchPlayers('LeBron', 10);
```

### `fetchTeams(season?)`

```typescript
import { fetchTeams } from '@/lib/actions/nba-stats';

const teams = await fetchTeams(2025);
// Returns: ["ATL", "BOS", "BRK", ...]
```

### `fetchPositions()`

```typescript
import { fetchPositions } from '@/lib/actions/nba-stats';

const positions = await fetchPositions();
// Returns: ["C", "PF", "PG", "SF", "SG"]
```

## AI Tool

For use in the chat interface, import the `queryNBAStatsTool`:

```typescript
import { queryNBAStatsTool } from '@/lib/actions/nba-stats-tool';

// Add to your AI tools configuration
tools: {
  queryNBAStats: queryNBAStatsTool,
  // ... other tools
}
```

The tool accepts the same parameters as the API endpoint and can be used by the AI to answer questions about player statistics.

## Database Schema

The `nba_stats` table includes:

### Player Information
- `id`, `season`, `league`, `player`, `playerId`, `age`, `team`, `position`

### Fantasy Points
- `fptsTotal` - Total fantasy points
- `fpts` - Average fantasy points per game

### Game Stats
- `games`, `gamesStarted`, `minutesPlayed`

### Shooting Stats
- Field Goals: `fgMade`, `fgAttempted`, `fgPercentage`
- 3-Pointers: `x3pMade`, `x3pAttempted`, `x3pPercentage`
- 2-Pointers: `x2pMade`, `x2pAttempted`, `x2pPercentage`
- Free Throws: `ftMade`, `ftAttempted`, `ftPercentage`
- `eFgPercentage` - Effective field goal percentage

### Counting Stats
- Rebounds: `offensiveRebounds`, `defensiveRebounds`, `totalRebounds`
- Other: `assists`, `steals`, `blocks`, `turnovers`, `personalFouls`, `points`
- `tripleDoubles`

### Draft Status
- `drafted` - Boolean flag indicating if player has been drafted

### Metadata
- `createdAt`, `updatedAt`

## Frontend Usage Example

```typescript
'use client';

import { useEffect, useState } from 'react';
import { NbaStats } from '@/lib/db/schema/nba-stats';

export default function PlayersPage() {
  const [players, setPlayers] = useState<NbaStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      const response = await fetch('/api/nba-stats?season=2025&drafted=false&limit=50');
      const data = await response.json();
      setPlayers(data.data);
      setLoading(false);
    };

    fetchPlayers();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Available Players</h1>
      {players.map(player => (
        <div key={player.id}>
          <h2>{player.player}</h2>
          <p>Team: {player.team} | Position: {player.position}</p>
          <p>Fantasy Points: {player.fpts}</p>
        </div>
      ))}
    </div>
  );
}
```

## TypeScript Types

All types are exported from the schema:

```typescript
import { NbaStats, NewNbaStats, FilterNbaStatsParams } from '@/lib/db/schema/nba-stats';
```

- `NbaStats` - Full player stats record
- `NewNbaStats` - Type for inserting new records
- `FilterNbaStatsParams` - Type for filter parameters

