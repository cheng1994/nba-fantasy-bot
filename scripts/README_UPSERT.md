# NBA Stats Import - UPSERT Support

## Overview

The `import_nba_stats.py` script now supports **UPSERT** (Update or Insert) functionality, allowing you to safely add missed players or update existing player stats without losing data.

## What Changed?

### 1. UPSERT Logic
The script now uses PostgreSQL's `ON CONFLICT DO UPDATE` clause:
- **New players** are inserted
- **Existing players** (same `player_id`, `season`, `team`) are updated with new stats
- No duplicate records are created

### 2. Unique Constraint
A database constraint ensures each player can only have one record per season per team:
```sql
UNIQUE (player_id, season, team)
```

### 3. Default Behavior
- **Old behavior**: Always cleared all data before importing (`clear_existing=True`)
- **New behavior**: Safely adds/updates records without clearing (`clear_existing=False`)

## How to Use

### First Time Setup (If you already have data)

If you already have data in the database, you need to apply the unique constraint first:

```bash
# Apply unique constraint (removes duplicates and adds constraint)
./scripts/apply_unique_constraint.sh
```

This will:
1. Remove any existing duplicate records (keeping the most recent)
2. Add the unique constraint to prevent future duplicates

**Note**: This script uses TypeScript and your existing database connection setup, so no need to install PostgreSQL client tools.

### Import Missed Players

Now you can safely import new or updated player stats:

```bash
# Replace the CSV file with your updated data
cp new-stats.csv public/stats/nba-stats.csv

# Run the import (will add new players and update existing ones)
python3 scripts/import_nba_stats.py
```

### Full Data Replacement (If needed)

If you want to completely replace all data:

```python
# Modify scripts/import_nba_stats.py line 274 to:
if importer.import_csv(csv_file_path, clear_existing=True):
```

Or directly in your code:
```python
importer = NBAStatsImporter(connection_string)
importer.connect()
importer.import_csv('path/to/csv', clear_existing=True)
```

## Benefits

✅ **No data loss** - Existing players remain in the database  
✅ **Update stats** - Player stats can be refreshed with latest data  
✅ **Add missed players** - New players are added seamlessly  
✅ **Prevent duplicates** - Database constraint ensures data integrity  
✅ **Idempotent** - Can run the import multiple times safely  

## Examples

### Scenario 1: Adding Missed Players
```bash
# You have 100 players in DB
# CSV has 110 players (10 new players + 100 existing)
python3 scripts/import_nba_stats.py
# Result: 110 players total (10 added, 100 updated)
```

### Scenario 2: Updating Stats
```bash
# Season progresses, player stats change
# Update CSV with latest stats
python3 scripts/import_nba_stats.py
# Result: All players updated with latest stats
```

### Scenario 3: Multiple Teams
```bash
# Player traded mid-season
# CSV has separate rows for each team
# player_id=ABC, season=2024, team=LAL (30 games)
# player_id=ABC, season=2024, team=MIA (25 games)
# Result: Two separate records (one per team)
```

## Technical Details

### Unique Constraint
```sql
ALTER TABLE nba_stats 
ADD CONSTRAINT unique_player_season_team 
UNIQUE (player_id, season, team);
```

### UPSERT Query
```sql
INSERT INTO nba_stats (...)
VALUES (...)
ON CONFLICT (player_id, season, team) 
DO UPDATE SET
    fpts_total = EXCLUDED.fpts_total,
    points = EXCLUDED.points,
    ...
    updated_at = CURRENT_TIMESTAMP
```

## Troubleshooting

### Error: "duplicate key value violates unique constraint"

**Cause**: Unique constraint already exists and you're trying to insert a duplicate

**Solution**: The UPSERT logic should handle this. Make sure you're using the updated script.

### Error: "constraint does not exist"

**Cause**: The unique constraint hasn't been applied yet

**Solution**: Run `./scripts/apply_unique_constraint.sh` first

### Want to check for duplicates manually?

```sql
-- Find duplicate players
SELECT player_id, season, team, COUNT(*) 
FROM nba_stats 
GROUP BY player_id, season, team 
HAVING COUNT(*) > 1;
```

