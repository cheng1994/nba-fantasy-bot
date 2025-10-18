# Wishlist Actions

This directory contains server actions for managing player wishlists.

## Files

### `wishlist.ts`
Server actions for CRUD operations on the player wishlist:

- `addToWishlist()` - Add a player to user's wishlist
- `removeFromWishlist()` - Remove a player from wishlist
- `getWishlist()` - Get user's full wishlist with player details
- `updateWishlistPriority()` - Update priority level or notes
- `isPlayerWishlisted()` - Check if specific player is wishlisted
- `getWishlistPlayerIds()` - Get just player IDs for quick lookups

### `wishlist-tool.ts`
AI chat tools for wishlist integration:

- `getWishlistTool` - Full wishlist retrieval for AI recommendations
- `getWishlistPlayerIdsTool` - Quick player ID lookup for ranking
- `checkPlayerWishlistStatusTool` - Check individual player status

## Usage Examples

### Server Actions

```typescript
import { addToWishlist, getWishlist } from '@/lib/actions/wishlist'

// Add player to wishlist
const result = await addToWishlist({
  owner: 'user_123',
  playerId: 'curryst01', 
  season: 2025,
  priority: 1,
  notes: 'Elite three-point shooter'
})

if (result.success) {
  console.log('Added:', result.data)
} else {
  console.error('Error:', result.error)
}

// Get user's wishlist
const wishlist = await getWishlist({
  owner: 'user_123',
  season: 2025
})

console.log('Wishlist:', wishlist.data)
```

### In API Routes

```typescript
import { getWishlist } from '@/lib/actions/wishlist'
import { stackServerApp } from '@/stack/server'

export async function GET(request: Request) {
  const user = await stackServerApp.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = await getWishlist({
    owner: user.id,
    season: 2025
  })

  return Response.json(result)
}
```

### In Components

```typescript
'use client'

async function handleAddToWishlist(playerId: string) {
  const response = await fetch('/api/wishlist', {
    method: 'POST',
    body: JSON.stringify({
      playerId,
      season: 2025,
      priority: 1
    })
  })
  
  const data = await response.json()
  // Handle response...
}
```

## Priority System

Priority levels affect ranking boosts in AI recommendations:

- **1** (Highest): ~15-20 spot boost
- **2-3** (High): ~10-15 spot boost  
- **4-6** (Medium): ~5-10 spot boost
- **7-10** (Low): ~3-5 spot boost

## Notes Field

Use the notes field to document strategy:
- "Fits punt FG% strategy"
- "Need another PG"
- "Best value in this range"
- "Injury risk but high upside"

## AI Integration

The AI chat assistant uses wishlist tools to:

1. Check user's wishlist at start of recommendations
2. Apply ranking boosts based on priority
3. Highlight wishlisted players with 🌟 emoji
4. Balance user preference with statistical value

See `WISHLIST_FEATURE.md` for full documentation.

