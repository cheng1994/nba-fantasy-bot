# NBA Stats Database Import

This directory contains scripts to import NBA player statistics from CSV files into a Neon PostgreSQL database.

## Files

- `create_nba_stats_table.sql` - SQL script to create the NBA stats table
- `import_nba_stats.py` - Python script to import CSV data into the database
- `setup_and_import.sh` - Bash script to set up environment and run import
- `requirements.txt` - Python dependencies
- `README.md` - This file

## Prerequisites

1. **Neon Database**: You need a Neon database instance. Get one at [console.neon.tech](https://console.neon.tech/)
2. **Python 3**: Make sure Python 3 is installed on your system
3. **Database Connection String**: Your Neon database connection URL

## Quick Start

1. **Set your database connection string**:
   ```bash
   export NEON_DATABASE_URL='postgresql://username:password@host:port/database'
   ```

2. **Run the setup and import script**:
   ```bash
   ./setup_and_import.sh
   ```

## Manual Setup

If you prefer to run the steps manually:

1. **Install Python dependencies**:
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Create the database table**:
   ```bash
   psql $NEON_DATABASE_URL -f ../sql/create_nba_stats_table.sql
   ```

3. **Run the import script**:
   ```bash
   python3 import_nba_stats.py
   ```

## Database Schema

The `nba_stats` table includes the following columns:

### Player Information
- `season` - NBA season year
- `league` - League (NBA)
- `player` - Player name
- `player_id` - Unique player identifier
- `age` - Player age
- `team` - Team abbreviation
- `position` - Player position

### Fantasy Points
- `fpts_total` - Total fantasy points
- `fpts` - Fantasy points per game

### Games
- `games` - Games played
- `games_started` - Games started
- `minutes_played` - Total minutes played

### Shooting Statistics
- `fg_made`, `fg_attempted`, `fg_percentage` - Field goals
- `x3p_made`, `x3p_attempted`, `x3p_percentage` - 3-point field goals
- `x2p_made`, `x2p_attempted`, `x2p_percentage` - 2-point field goals
- `e_fg_percentage` - Effective field goal percentage
- `ft_made`, `ft_attempted`, `ft_percentage` - Free throws

### Other Statistics
- `offensive_rebounds`, `defensive_rebounds`, `total_rebounds` - Rebounds
- `assists` - Assists
- `steals` - Steals
- `blocks` - Blocks
- `turnovers` - Turnovers
- `personal_fouls` - Personal fouls
- `points` - Total points
- `triple_doubles` - Triple doubles

### Metadata
- `created_at` - Record creation timestamp
- `updated_at` - Record last update timestamp

## Example Queries

After importing, you can query the data:

```sql
-- Top 10 players by fantasy points
SELECT player, team, position, fpts_total, points, assists, total_rebounds
FROM nba_stats 
ORDER BY fpts_total DESC 
LIMIT 10;

-- Players by team
SELECT team, COUNT(*) as player_count
FROM nba_stats 
WHERE team IS NOT NULL
GROUP BY team 
ORDER BY player_count DESC;

-- Centers with most blocks
SELECT player, team, blocks, total_rebounds
FROM nba_stats 
WHERE position = 'C'
ORDER BY blocks DESC 
LIMIT 10;

-- Players with triple doubles
SELECT player, team, triple_doubles, fpts_total
FROM nba_stats 
WHERE triple_doubles > 0
ORDER BY triple_doubles DESC;
```

## Troubleshooting

### Connection Issues
- Verify your `NEON_DATABASE_URL` is correct
- Check that your Neon database is running
- Ensure your IP is whitelisted in Neon (if required)

### Import Issues
- Check that the CSV file exists at `../public/stats/nba-stats.csv`
- Verify the CSV format matches the expected structure
- Check the logs for specific error messages

### Permission Issues
- Make sure the script has execute permissions: `chmod +x setup_and_import.sh`
- Ensure you have write access to the database

## Data Source

The NBA stats data is sourced from the `nba-stats.csv` file in the `public/stats/` directory. This file contains comprehensive player statistics for the 2025 NBA season.

