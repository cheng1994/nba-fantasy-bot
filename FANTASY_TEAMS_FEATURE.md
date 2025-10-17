# Fantasy Teams Feature - Quick Reference

## ✅ What Was Created

A complete fantasy basketball team management system with:
- **Database tables** for teams and rosters
- **13-player roster** per team (enforced at database level)
- **Position requirements**: PG, SG, SF, PF, C, G (required) + F, UTIL, BENCH (flexible)
- **Multi-position support**: Players can be eligible for multiple positions
- **Server actions** for all CRUD operations
- **Validation** to ensure roster completeness

## 📁 Files Created/Modified

### New Files
1. `src/lib/db/schema/fantasy-teams.ts` - Database schema (tables: fantasy_teams, team_rosters)
2. `src/lib/actions/fantasy-teams.ts` - Server actions for team management
3. `sql/create_fantasy_teams_tables.sql` - SQL migration script
4. `scripts/setup_fantasy_teams.sh` - Setup automation script
5. `scripts/example_fantasy_team_usage.ts` - Example code
6. `src/lib/actions/README_FANTASY_TEAMS.md` - Comprehensive documentation
7. `scripts/README_FANTASY_TEAMS_SETUP.md` - Setup guide

### Modified Files
- `src/lib/db/index.ts` - Added fantasy team schema exports

## 🚀 Quick Start (3 Steps)

### 1. Create Database Tables
```bash
./scripts/setup_fantasy_teams.sh
```

### 2. Import and Use
```typescript
import { createFantasyTeam, addPlayerToRoster } from '@/lib/actions/fantasy-teams';

// Create team
const team = await createFantasyTeam({
  name: 'My Dream Team',
  owner: 'user123',
  season: 2024
});

// Add player
await addPlayerToRoster({
  teamId: team.id,
  playerId: 'curryst01',
  designatedPosition: 'PG',
  eligiblePositions: 'PG,SG',
  rosterOrder: 0
});
```

### 3. Run Example
```bash
tsx scripts/example_fantasy_team_usage.ts
```

## 🏀 Roster Structure

**13 Total Players:**
- 1 PG (Point Guard)
- 1 SG (Shooting Guard)
- 1 SF (Small Forward)
- 1 PF (Power Forward)
- 1 C (Center)
- 1 G (Guard - any guard position)
- 1 F (Forward - any forward position)
- 2 UTIL (Utility - any position)
- 4 BENCH (Bench players)

## 📚 Available Actions

### Team Actions
- `createFantasyTeam()` - Create new team
- `getFantasyTeam()` - Get team with roster
- `getFantasyTeamsByOwner()` - Get all user's teams
- `deleteFantasyTeam()` - Delete team

### Roster Actions
- `addPlayerToRoster()` - Add player (max 13)
- `removePlayerFromRoster()` - Remove player
- `updateRosterSpot()` - Change position/order
- `getTeamRoster()` - Get roster list

### Utility Actions
- `validateRosterPositions()` - Check if all positions filled
- `getAvailablePlayers()` - Get players not on team

## 🔍 Key Features

### Multi-Position Eligibility
Players can be eligible for multiple positions:
```typescript
eligiblePositions: "PG,SG"    // Can play Point Guard or Shooting Guard
eligiblePositions: "SF,PF"    // Can play Small or Power Forward
eligiblePositions: "C"        // Only plays Center
```

### Database Validation
- ✅ Max 13 players per team (trigger-enforced)
- ✅ No duplicate players on same team
- ✅ One team per user per season
- ✅ Cascade delete (removing team removes roster)

### Performance Optimized
- Indexed for fast queries
- Efficient JOIN queries for roster + player stats
- Optimized available player lookups

## 📖 Documentation

**Main Documentation**: `src/lib/actions/README_FANTASY_TEAMS.md`
- Complete API reference
- Schema details
- Example workflows
- Type definitions

**Setup Guide**: `scripts/README_FANTASY_TEAMS_SETUP.md`
- Installation instructions
- Troubleshooting
- Integration guide

## 🗃️ Database Schema

### fantasy_teams
```sql
id, name, owner, season, created_at, updated_at
UNIQUE(owner, season)
```

### team_rosters
```sql
id, team_id, player_id, designated_position, 
eligible_positions, roster_order, added_at
UNIQUE(team_id, player_id)
FOREIGN KEY(team_id) REFERENCES fantasy_teams(id) ON DELETE CASCADE
```

## 🎯 Example Usage

```typescript
// 1. Create team
const team = await createFantasyTeam({
  name: 'Lakers Squad',
  owner: 'user123',
  season: 2024
});

// 2. Add required positions
await addPlayerToRoster({
  teamId: team.id,
  playerId: 'curryst01',
  designatedPosition: 'PG',
  eligiblePositions: 'PG,SG',
  rosterOrder: 0
});
// ... add more players for SG, SF, PF, C, G, etc.

// 3. Validate roster
const validation = await validateRosterPositions(team.id);
if (validation.isValid) {
  console.log('✅ Roster complete!');
} else {
  console.log('❌ Missing:', validation.missingPositions);
}

// 4. Get full team
const fullTeam = await getFantasyTeam(team.id);
console.log(`${fullTeam.name}: ${fullTeam.roster.length} players`);
```

## 🔧 Integration Points

The fantasy teams feature connects with:
- **nba_stats table**: Links via `player_id`
- **Drizzle ORM**: Uses same patterns
- **Server Actions**: Follows same conventions

## ⚡ Next Steps

Suggested enhancements:
- [ ] Create UI components for team management
- [ ] Add draft functionality
- [ ] Implement trades between teams
- [ ] Build lineup optimizer
- [ ] Add head-to-head matchups
- [ ] Create league standings

## 🆘 Help

If you need help:
1. Review the example: `scripts/example_fantasy_team_usage.ts`
2. Read the docs: `src/lib/actions/README_FANTASY_TEAMS.md`
3. Check the setup guide: `scripts/README_FANTASY_TEAMS_SETUP.md`

---

**Ready to use!** Just run the setup script and start building your fantasy teams. 🏆

