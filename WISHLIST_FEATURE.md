# Player Wishlist Feature

## Overview

The Player Wishlist feature allows users to mark their preferred players for the draft. Wishlisted players receive a ranking boost in AI draft recommendations, ensuring that user preferences are taken into account alongside statistical analysis.

## Key Concept

The AI assistant now balances **statistical value** (projected fantasy points) with **user preference** (wishlist priority). For example:

- **Player A**: Rank 5 based on projected_fpts, NOT on wishlist
- **Player B**: Rank 20 based on projected_fpts, ON wishlist with Priority 1

→ The AI will **highlight Player B** as a preferred option due to user preference, even though they're statistically ranked lower.

## Database Schema

### Table: `player_wishlist`

| Column      | Type         | Description                                        |
|-------------|--------------|---------------------------------------------------|
| id          | SERIAL       | Primary key                                       |
| owner       | TEXT         | Stack Auth user ID                                |
| player_id   | VARCHAR(20)  | References nba_stats.player_id                    |
| season      | INTEGER      | Season (e.g., 2025)                               |
| priority    | INTEGER      | Priority level 1-10 (1 = highest)                 |
| notes       | TEXT         | Optional notes about why user wants this player   |
| created_at  | TIMESTAMP    | When the wishlist item was created                |
| updated_at  | TIMESTAMP    | When the wishlist item was last updated           |

**Constraints:**
- Unique constraint on (owner, player_id, season) - can't wishlist same player twice per season
- Priority must be between 1-10

**Indexes:**
- `idx_player_wishlist_owner` - Fast lookups by user
- `idx_player_wishlist_season` - Fast lookups by season
- `idx_player_wishlist_owner_season` - Fast lookups by user + season
- `idx_player_wishlist_player_id` - Fast lookups by player

## Priority System

The AI uses priority levels to determine ranking boosts:

| Priority Level | Description | Ranking Boost         |
|----------------|-------------|-----------------------|
| 1              | Highest     | ~15-20 spots          |
| 2-3            | High        | ~10-15 spots          |
| 4-6            | Medium      | ~5-10 spots           |
| 7-10           | Low         | ~3-5 spots            |

## Setup

1. Run the setup script:
```bash
export DATABASE_URL='your_neon_database_url'
bash scripts/setup_wishlist.sh
```

2. The script will create the `player_wishlist` table with all indexes and constraints.

## API Usage

### Add Player to Wishlist

```bash
POST /api/wishlist
Content-Type: application/json

{
  "playerId": "curryst01",
  "season": 2025,
  "priority": 1,
  "notes": "Great for my punt FG% strategy"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "owner": "user_123",
    "playerId": "curryst01",
    "season": 2025,
    "priority": 1,
    "notes": "Great for my punt FG% strategy",
    "createdAt": "2025-10-17T...",
    "updatedAt": "2025-10-17T..."
  }
}
```

### Get User's Wishlist

```bash
GET /api/wishlist?season=2025
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "owner": "user_123",
      "playerId": "curryst01",
      "season": 2025,
      "priority": 1,
      "notes": "Great for my punt FG% strategy",
      "playerName": "Stephen Curry",
      "team": "GSW",
      "position": "PG",
      "age": 36,
      "projectedFpts": 2156.5,
      "fpts": 51.8,
      "drafted": false,
      "createdAt": "2025-10-17T..."
    }
  ]
}
```

### Check if Player is Wishlisted

```bash
GET /api/wishlist?season=2025&playerId=curryst01
```

**Response:**
```json
{
  "success": true,
  "isWishlisted": true,
  "priority": 1
}
```

### Update Wishlist Priority

```bash
PATCH /api/wishlist
Content-Type: application/json

{
  "id": 1,
  "priority": 2,
  "notes": "Updated strategy notes"
}
```

### Remove from Wishlist

```bash
DELETE /api/wishlist?id=1
```

**Response:**
```json
{
  "success": true
}
```

## AI Chat Integration

The AI assistant automatically:

1. **Checks wishlists** when making draft recommendations
2. **Applies ranking boosts** based on priority levels
3. **Highlights wishlisted players** with 🌟 emoji
4. **Balances preference with value** - won't recommend rank 100 players just because they're wishlisted

### Example AI Interaction

**User**: "Who should I pick in round 10?"

**AI Response**:
```
Based on the latest stats and your wishlist preferences, 
here are solid round-10 targets:

🌟 Jalen Brunson (on your wishlist, priority 1) - Your preferred pick
   Projected FPTS: 1,834 | 44.9 PPG | Great scorer and assists

Cade Cunningham - Top statistical value at this point
   Projected FPTS: 1,856 | 45.3 PPG | Rising star

Darius Garland - Best available guard
   Projected FPTS: 1,812 | 44.1 PPG | Solid playmaker
```

## AI Tools Available

The chat assistant has access to three wishlist tools:

### 1. `getWishlist`
- Retrieves full wishlist with player details
- Used for comprehensive recommendations

### 2. `getWishlistPlayerIds`
- Quick lookup of wishlisted player IDs and priorities
- Efficient for checking many players at once

### 3. `checkPlayerWishlistStatus`
- Checks if a specific player is wishlisted
- Returns priority level if wishlisted

## Code Examples

### Server Actions

```typescript
import { addToWishlist, getWishlist } from '@/lib/actions/wishlist'

// Add to wishlist
const result = await addToWishlist({
  owner: user.id,
  playerId: 'curryst01',
  season: 2025,
  priority: 1,
  notes: 'Elite shooter'
})

// Get wishlist
const wishlist = await getWishlist({
  owner: user.id,
  season: 2025
})
```

### In Components

```typescript
'use client'

async function addPlayerToWishlist(playerId: string) {
  const response = await fetch('/api/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId,
      season: 2025,
      priority: 1
    })
  })
  
  const data = await response.json()
  if (data.success) {
    console.log('Added to wishlist!')
  }
}
```

## Best Practices

1. **Set appropriate priorities**: Use priority 1 only for your absolute must-have players
2. **Add notes**: Document your strategy reasons (e.g., "Fits punt FG% build")
3. **Update regularly**: As the draft progresses, update priorities based on who's available
4. **Don't over-wishlist**: Keep your wishlist focused (aim for 10-20 players per season)
5. **Balance with stats**: Trust the AI's balance between preference and statistical value

## Benefits

✅ **Personalized recommendations** - AI considers your specific preferences  
✅ **Strategic flexibility** - Adjust priorities as draft unfolds  
✅ **Clear visibility** - Wishlisted players are highlighted with 🌟  
✅ **Smart balancing** - AI won't recommend terrible players just because they're wishlisted  
✅ **Notes for strategy** - Document why you want specific players  

## Future Enhancements

Potential future features:
- Bulk import from CSV
- Auto-wishlist based on team needs
- Wishlist suggestions from AI
- Export wishlist for draft day
- Share wishlists with league mates

