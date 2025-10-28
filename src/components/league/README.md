# League UI Components

A complete set of React components for H2H fantasy basketball leagues with Sleeper-style lineup locking features.

## Components

### 1. `LeagueDashboard`
Main dashboard component that orchestrates all league functionality.

**Features:**
- League overview with status and quick stats
- Tabbed interface for different sections
- User team detection and context
- Real-time data fetching

**Usage:**
```tsx
import { LeagueDashboard } from '@/components/league'

<LeagueDashboard leagueId={1} weekNumber={3} />
```

### 2. `LineupManager`
Sleeper-style lineup management with lock-in functionality.

**Features:**
- ✅ 9 required starting positions (PG, SG, SF, PF, C, G, F, UTIL1, UTIL2)
- ✅ Bench management with unlimited spots
- ✅ **Lineup locking** - prevents changes after lock
- ✅ Position eligibility validation
- ✅ Real-time lineup validation
- ✅ Auto-save and manual save
- ✅ Visual feedback for lock status

**Key Features:**
- **Lock System**: `isLocked` boolean with `lockedAt` timestamp
- **Position Validation**: Ensures players can fill assigned positions
- **Roster Management**: Drag-drop style interface for setting lineups
- **Save/Lock Workflow**: Save lineup → Lock lineup → No more changes

**Usage:**
```tsx
import { LineupManager } from '@/components/league'

<LineupManager
  leagueId={1}
  teamId={5}
  matchupId={25}
  weekNumber={3}
  initialLineup={existingLineup}
  rosterPlayers={userRosterPlayers}
  onLineupChange={(lineup) => console.log('Lineup updated')}
/>
```

### 3. `MatchupView`
Head-to-head matchup display with live scoring.

**Features:**
- ✅ Team vs team layout
- ✅ Live scoring updates
- ✅ Lineup lock status indicators
- ✅ Win/loss/tie tracking
- ✅ Playoff matchup indicators
- ✅ Team records and standings

**Usage:**
```tsx
import { MatchupView } from '@/components/league'

<MatchupView matchupId={25} />
```

### 4. `Standings`
League standings with playoff picture.

**Features:**
- ✅ Win-loss-tie records
- ✅ Win percentage calculation
- ✅ Points for/against tracking
- ✅ Playoff line visualization
- ✅ Position-based styling (1st place, playoff teams, eliminated)
- ✅ Trophy/medal icons for top teams

**Usage:**
```tsx
import { Standings } from '@/components/league'

<Standings leagueId={1} playoffTeams={6} />
```

### 5. `WaiverWire`
Player acquisition via waivers and FAAB.

**Features:**
- ✅ Available player browsing
- ✅ Search and position filtering
- ✅ **FAAB bidding system**
- ✅ Add/drop transactions
- ✅ Rolling waiver priority support
- ✅ Player trending indicators
- ✅ Roster management integration

**Usage:**
```tsx
import { WaiverWire } from '@/components/league'

<WaiverWire
  leagueId={1}
  teamId={5}
  weekNumber={3}
  faabBudget={85}
  waiverType="faab"
  rosterPlayers={currentRoster}
  onTransactionSubmitted={() => refetchData()}
/>
```

## Authentication Integration

All components use **Stack Auth** for user authentication:

```tsx
import { useUser } from '@stackframe/stack'

const user = useUser()
if (!user) {
  return <div>Please sign in</div>
}
```

## API Integration

Components integrate with the league API endpoints:

- `GET /api/league?leagueId=X` - League details
- `GET /api/league/[leagueId]/standings` - Standings
- `GET /api/league/matchup/[matchupId]` - Matchup details
- `POST /api/league/lineup` - Save/lock lineup
- `POST /api/league/waiver` - Submit waiver claims
- `POST /api/league/trade` - Trade management

## Styling & Theming

Built with **Tailwind CSS** and **shadcn/ui** components:

- Responsive design (mobile-first)
- Dark/light mode support
- Consistent color scheme
- Loading states and error handling
- Accessibility features

## Key Features Summary

### 🔒 **Sleeper Lock-In System**
- Lock lineups at game time
- Visual lock indicators
- Prevent changes after lock
- `isLocked` boolean tracking

### 🏀 **H2H Fantasy Points**
- Weekly matchups
- Live scoring
- Win/loss tracking
- Standings management

### 💰 **FAAB Waiver System**
- Auction bidding
- Budget tracking
- Add/drop transactions
- Priority-based alternatives

### 📊 **Real-Time Updates**
- Live score updates
- Automatic data refresh
- Optimistic UI updates
- Error handling & retry

## File Structure

```
src/components/league/
├── index.ts                 # Exports
├── README.md               # This file
├── league-dashboard.tsx    # Main dashboard
├── lineup-manager.tsx      # Lineup management
├── matchup-view.tsx        # H2H matchup display
├── standings.tsx           # League standings
└── waiver-wire.tsx         # Waiver/FAAB system
```

## Dependencies

```json
{
  "@stackframe/stack": "^x.x.x",
  "@radix-ui/react-dialog": "^x.x.x",
  "@radix-ui/react-select": "^x.x.x",
  "@tanstack/react-table": "^x.x.x",
  "lucide-react": "^x.x.x"
}
```

## Development

### Adding New Features

1. **New Component**: Follow existing patterns with Stack Auth integration
2. **API Integration**: Use fetch with proper error handling
3. **Styling**: Use Tailwind classes and shadcn/ui components
4. **State Management**: Use React state with proper TypeScript types

### Testing Components

```tsx
// Test with mock data
const mockProps = {
  leagueId: 1,
  teamId: 5,
  weekNumber: 3,
  // ... other required props
}

<LineupManager {...mockProps} />
```

### Common Patterns

**Loading State:**
```tsx
if (isLoading) {
  return <Spinner className="h-8 w-8" />
}
```

**Error State:**
```tsx
if (error) {
  return <p className="text-destructive">{error}</p>
}
```

**Auth Check:**
```tsx
const user = useUser()
if (!user) {
  return <div>Please sign in</div>
}
```

## Next Steps

1. **Real Player Data**: Integrate with NBA stats API
2. **Push Notifications**: Real-time updates for lineup locks
3. **Mobile App**: React Native version
4. **Advanced Analytics**: Player trends and projections
5. **Social Features**: League chat and trash talk

---

**Built with ❤️ for fantasy basketball enthusiasts** 🏀
