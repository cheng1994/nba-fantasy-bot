# Stack Auth Integration with Fantasy Teams

This document explains how the `fantasy_teams` table integrates with Stack Auth for user authentication.

## Overview

The `fantasy_teams.owner` column stores Stack Auth user IDs (`user.id`) to associate fantasy teams with authenticated users.

**Important:** No foreign key constraint is used, following auth best practices. User management happens externally through Stack Auth, and FK constraints could break referential integrity.

## Database Schema

### fantasy_teams table

```sql
CREATE TABLE fantasy_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner TEXT NOT NULL,  -- Stack Auth user ID
    season INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_owner_season UNIQUE (owner, season)
);
```

### Migration

If you have existing data, run the migration:

```bash
psql $DATABASE_URL -f sql/migrate_fantasy_teams_owner_to_text.sql
```

## Usage Examples

### Server Components

```tsx
import { stackServerApp } from "@/stack/server";
import { getFantasyTeamsByOwner } from "@/lib/actions/fantasy-teams";

export default async function MyTeamsPage() {
  // Get the authenticated user
  const user = await stackServerApp.getUser({ or: "redirect" });
  
  // Fetch teams for this user
  const teams = await getFantasyTeamsByOwner(user.id, 2025);
  
  return (
    <div>
      <h1>Teams for {user.displayName}</h1>
      {teams.map(team => (
        <div key={team.id}>{team.name}</div>
      ))}
    </div>
  );
}
```

### Server Actions

```tsx
'use server';

import { stackServerApp } from "@/stack/server";
import { createFantasyTeam } from "@/lib/actions/fantasy-teams";

export async function createTeamAction(teamName: string) {
  // Get the authenticated user
  const user = await stackServerApp.getUser({ or: "redirect" });
  
  // Create team for this user
  const team = await createFantasyTeam({
    name: teamName,
    owner: user.id,
    season: 2025,
  });
  
  return team;
}
```

### Ownership Verification

Always verify ownership before allowing modifications:

```tsx
'use server';

import { stackServerApp } from "@/stack/server";
import { getFantasyTeam, addPlayerToRoster } from "@/lib/actions/fantasy-teams";

export async function addPlayerAction(teamId: number, playerId: string) {
  const user = await stackServerApp.getUser({ or: "redirect" });
  const team = await getFantasyTeam(teamId);
  
  if (!team) {
    throw new Error('Team not found');
  }
  
  // Verify ownership
  if (team.owner !== user.id) {
    throw new Error('Unauthorized: You do not own this team');
  }
  
  // Proceed with adding player
  return await addPlayerToRoster({
    teamId,
    playerId,
    designatedPosition: 'BENCH',
    eligiblePositions: 'PG,SG',
  });
}
```

### Getting Team with Owner Info

```tsx
import { stackServerApp } from "@/stack/server";
import { getFantasyTeam } from "@/lib/actions/fantasy-teams";

export async function getTeamWithOwner(teamId: number) {
  const team = await getFantasyTeam(teamId);
  
  if (!team) {
    return null;
  }
  
  // Fetch owner information from Stack Auth
  const owner = await stackServerApp.getUser(team.owner);
  
  return {
    ...team,
    ownerInfo: owner ? {
      id: owner.id,
      displayName: owner.displayName,
      email: owner.primaryEmail,
      avatar: owner.profileImageUrl,
    } : null,
  };
}
```

## Best Practices

1. **Always authenticate first**: Use `stackServerApp.getUser({ or: "redirect" })` in protected routes
2. **Verify ownership**: Check that `team.owner === user.id` before allowing modifications
3. **Use user.id**: Always use the Stack Auth `user.id` field, not email or display name
4. **Handle missing users**: Users can be deleted from Stack Auth, so handle null cases
5. **Server Components preferred**: Use Server Components for auth checks when possible

## Why No Foreign Key?

Stack Auth manages users externally. A foreign key constraint would:
- Break if users are deleted in Stack Auth
- Prevent user operations that should succeed
- Create tight coupling between auth and app data

Instead, use application-level checks and LEFT JOINs in queries where needed.

## Example Files

- `src/lib/actions/fantasy-teams-with-auth.example.ts` - Complete working examples
- `sql/migrate_fantasy_teams_owner_to_text.sql` - Migration script

## Stack Auth Resources

- User object: Access via `stackServerApp.getUser()`
- User ID: `user.id` (string)
- Display name: `user.displayName`
- Email: `user.primaryEmail`
- Avatar: `user.profileImageUrl`

For more Stack Auth features, see the Stack Auth documentation.

