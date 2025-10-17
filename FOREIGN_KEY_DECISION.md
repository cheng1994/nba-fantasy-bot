# Foreign Key Decision: Stack Auth Integration

## Your Question
Should the `fantasy_teams.owner` column have a `REFERENCES users(id)` constraint like in the Neon docs example?

## Short Answer
**No** - because Stack Auth users are **not** stored in your Neon database.

## The Difference

### Neon Docs Example (Local Users)
```sql
-- Neon docs assume you have a users table IN YOUR DATABASE
CREATE TABLE users (id TEXT PRIMARY KEY, ...);
CREATE TABLE todos (
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE  ✅ This works!
);
```

### Your Stack Auth Setup (External Users)
```sql
-- Stack Auth users are in Stack Auth's database (not yours)
-- No users table exists in your Neon database
CREATE TABLE fantasy_teams (
    owner TEXT -- Cannot reference a table that doesn't exist ❌
);
```

## Why No Foreign Key?

1. **Stack Auth users live elsewhere**: They're in Stack Auth's infrastructure, not your Neon database
2. **No target table**: You can't create `REFERENCES users(id)` when there's no `users` table
3. **Accessed via API**: You get users through `stackServerApp.getUser()`, not SQL queries

## Two Approaches

### Approach 1: No Foreign Key (Current - Recommended)
✅ **Pros:**
- Simple setup
- No sync complexity
- Follows Stack Auth best practices
- Works out of the box

❌ **Cons:**
- No database-level referential integrity
- Must validate in application code
- Can't join users in SQL queries

**Use this if:** You want simplicity and Stack Auth handles most user logic.

### Approach 2: Sync Users Locally (Optional)
Create a local `users` table that mirrors Stack Auth:

```sql
-- Create local users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,  -- Stack Auth user.id
    display_name TEXT,
    email TEXT,
    ...
);

-- NOW you can add FK constraint
ALTER TABLE fantasy_teams
    ADD FOREIGN KEY (owner) REFERENCES users(id) ON DELETE CASCADE;
```

✅ **Pros:**
- Database-level referential integrity
- Can join users in SQL
- Can add custom user fields
- Faster queries (no API calls)

❌ **Cons:**
- More complexity
- Must sync users (on signup, updates, deletes)
- Data can get out of sync
- Extra maintenance

**Use this if:** You need SQL joins, custom user fields, or strict referential integrity.

## Implementation Files

### Current Setup (No FK)
- ✅ Already implemented
- Migration: `sql/migrate_fantasy_teams_owner_to_text.sql`
- Examples: `src/lib/actions/fantasy-teams-with-auth.example.ts`

### Optional User Sync (With FK)
- 📄 Schema: `sql/optional_local_users_sync.sql`
- 📄 Sync utilities: `src/lib/actions/sync-users.example.ts`

## Recommendation

**Stick with Approach 1** (no FK) unless you have a specific need for:
- SQL joins with user data
- Custom user fields beyond what Stack Auth provides
- Strict database-level integrity

Stack Auth is designed to work without local user tables. Most apps using Stack Auth (or Auth0, Clerk, etc.) follow this pattern.

## When to Add FK

Add a foreign key constraint (Approach 2) only if you need to:

1. **Query teams with user data in SQL:**
   ```sql
   SELECT ft.*, u.display_name, u.email
   FROM fantasy_teams ft
   JOIN users u ON ft.owner = u.id;
   ```

2. **Store custom user data:**
   ```sql
   ALTER TABLE users ADD COLUMN favorite_team VARCHAR(50);
   ALTER TABLE users ADD COLUMN notification_preferences JSONB;
   ```

3. **Ensure orphaned data is deleted:**
   ```sql
   ON DELETE CASCADE -- Automatically delete teams when user is deleted
   ```

If you don't need these, the current setup is perfect! 🎯

