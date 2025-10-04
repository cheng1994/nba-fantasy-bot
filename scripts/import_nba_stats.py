#!/usr/bin/env python3
"""
NBA Stats CSV Import Script for Neon Database

This script imports NBA player statistics from a CSV file into a Neon PostgreSQL database.
"""

import os
import csv
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NBAStatsImporter:
    def __init__(self, connection_string: str):
        """Initialize the importer with database connection string."""
        self.connection_string = connection_string
        self.connection = None
    
    def connect(self) -> bool:
        """Establish connection to the database."""
        try:
            self.connection = psycopg2.connect(self.connection_string)
            logger.info("Successfully connected to Neon database")
            return True
        except psycopg2.Error as e:
            logger.error(f"Failed to connect to database: {e}")
            return False
    
    def disconnect(self):
        """Close database connection."""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def create_table(self) -> bool:
        """Create the NBA stats table if it doesn't exist."""
        try:
            with self.connection.cursor() as cursor:
                # Read and execute the SQL file
                sql_file_path = os.path.join(os.path.dirname(__file__), '..', 'sql', 'create_nba_stats_table.sql')
                with open(sql_file_path, 'r') as f:
                    sql_commands = f.read()
                
                cursor.execute(sql_commands)
                self.connection.commit()
                logger.info("NBA stats table created successfully")
                return True
        except Exception as e:
            logger.error(f"Failed to create table: {e}")
            return False
    
    def clear_existing_data(self) -> bool:
        """Clear existing data from the table."""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("DELETE FROM nba_stats")
                self.connection.commit()
                logger.info("Cleared existing data from nba_stats table")
                return True
        except Exception as e:
            logger.error(f"Failed to clear existing data: {e}")
            return False
    
    def parse_csv_row(self, row: Dict[str, str]) -> Dict[str, Any]:
        """Parse a CSV row and convert values to appropriate types."""
        def safe_int(value: str) -> Optional[int]:
            if not value or value.strip() == '' or value.upper() == 'NA':
                return None
            try:
                return int(float(value))
            except (ValueError, TypeError):
                return None
        
        def safe_float(value: str) -> Optional[float]:
            if not value or value.strip() == '' or value.upper() == 'NA':
                return None
            try:
                return float(value)
            except (ValueError, TypeError):
                return None
        
        def safe_str(value: str) -> Optional[str]:
            if not value or value.strip() == '' or value.upper() == 'NA':
                return None
            return value.strip()
        
        return {
            'season': safe_int(row.get('season')),
            'league': safe_str(row.get('lg')),
            'player': safe_str(row.get('player')),
            'player_id': safe_str(row.get('player_id')),
            'age': safe_int(row.get('age')),
            'team': safe_str(row.get('team')),
            'position': safe_str(row.get('pos')),
            'fpts_total': safe_float(row.get('fpts_total')),
            'fpts': safe_float(row.get('fpts')),
            'games': safe_int(row.get('g')),
            'games_started': safe_int(row.get('gs')),
            'minutes_played': safe_int(row.get('mp')),
            'fg_made': safe_int(row.get('fg')),
            'fg_attempted': safe_int(row.get('fga')),
            'fg_percentage': safe_float(row.get('fg_percent')),
            'x3p_made': safe_int(row.get('x3p')),
            'x3p_attempted': safe_int(row.get('x3pa')),
            'x3p_percentage': safe_float(row.get('x3p_percent')),
            'x2p_made': safe_int(row.get('x2p')),
            'x2p_attempted': safe_int(row.get('x2pa')),
            'x2p_percentage': safe_float(row.get('x2p_percent')),
            'e_fg_percentage': safe_float(row.get('e_fg_percent')),
            'ft_made': safe_int(row.get('ft')),
            'ft_attempted': safe_int(row.get('fta')),
            'ft_percentage': safe_float(row.get('ft_percent')),
            'offensive_rebounds': safe_int(row.get('orb')),
            'defensive_rebounds': safe_int(row.get('drb')),
            'total_rebounds': safe_int(row.get('trb')),
            'assists': safe_int(row.get('ast')),
            'steals': safe_int(row.get('stl')),
            'blocks': safe_int(row.get('blk')),
            'turnovers': safe_int(row.get('tov')),
            'personal_fouls': safe_int(row.get('pf')),
            'points': safe_int(row.get('pts')),
            'triple_doubles': safe_int(row.get('trp_dbl'))
        }
    
    def insert_player_stats(self, stats: Dict[str, Any]) -> bool:
        """Insert a single player's stats into the database."""
        try:
            with self.connection.cursor() as cursor:
                insert_query = """
                INSERT INTO nba_stats (
                    season, league, player, player_id, age, team, position,
                    fpts_total, fpts, games, games_started, minutes_played,
                    fg_made, fg_attempted, fg_percentage,
                    x3p_made, x3p_attempted, x3p_percentage,
                    x2p_made, x2p_attempted, x2p_percentage,
                    e_fg_percentage, ft_made, ft_attempted, ft_percentage,
                    offensive_rebounds, defensive_rebounds, total_rebounds,
                    assists, steals, blocks, turnovers, personal_fouls,
                    points, triple_doubles
                ) VALUES (
                    %(season)s, %(league)s, %(player)s, %(player_id)s, %(age)s, %(team)s, %(position)s,
                    %(fpts_total)s, %(fpts)s, %(games)s, %(games_started)s, %(minutes_played)s,
                    %(fg_made)s, %(fg_attempted)s, %(fg_percentage)s,
                    %(x3p_made)s, %(x3p_attempted)s, %(x3p_percentage)s,
                    %(x2p_made)s, %(x2p_attempted)s, %(x2p_percentage)s,
                    %(e_fg_percentage)s, %(ft_made)s, %(ft_attempted)s, %(ft_percentage)s,
                    %(offensive_rebounds)s, %(defensive_rebounds)s, %(total_rebounds)s,
                    %(assists)s, %(steals)s, %(blocks)s, %(turnovers)s, %(personal_fouls)s,
                    %(points)s, %(triple_doubles)s
                )
                """
                cursor.execute(insert_query, stats)
                return True
        except Exception as e:
            logger.error(f"Failed to insert stats for {stats.get('player', 'unknown')}: {e}")
            return False
    
    def import_csv(self, csv_file_path: str, clear_existing: bool = True) -> bool:
        """Import NBA stats from CSV file."""
        if not os.path.exists(csv_file_path):
            logger.error(f"CSV file not found: {csv_file_path}")
            return False
        
        try:
            # Create table if it doesn't exist
            if not self.create_table():
                return False
            
            # Clear existing data if requested
            if clear_existing:
                if not self.clear_existing_data():
                    return False
            
            # Import data from CSV
            imported_count = 0
            failed_count = 0
            
            with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                for row_num, row in enumerate(reader, start=2):  # Start at 2 because of header
                    try:
                        stats = self.parse_csv_row(row)
                        
                        if self.insert_player_stats(stats):
                            imported_count += 1
                            if imported_count % 50 == 0:
                                logger.info(f"Imported {imported_count} records...")
                        else:
                            failed_count += 1
                            logger.warning(f"Failed to import row {row_num}: {row.get('player', 'unknown')}")
                    
                    except Exception as e:
                        failed_count += 1
                        logger.error(f"Error processing row {row_num}: {e}")
            
            # Commit all changes
            self.connection.commit()
            
            logger.info(f"Import completed: {imported_count} records imported, {failed_count} failed")
            return failed_count == 0
            
        except Exception as e:
            logger.error(f"Import failed: {e}")
            return False
    
    def get_stats_summary(self) -> Dict[str, Any]:
        """Get summary statistics from the imported data."""
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Get basic counts
                cursor.execute("SELECT COUNT(*) as total_players FROM nba_stats")
                total_players = cursor.fetchone()['total_players']
                
                # Get top 5 players by fantasy points
                cursor.execute("""
                    SELECT player, team, position, fpts_total, points, assists, total_rebounds
                    FROM nba_stats 
                    ORDER BY fpts_total DESC 
                    LIMIT 5
                """)
                top_players = cursor.fetchall()
                
                # Get team distribution
                cursor.execute("""
                    SELECT team, COUNT(*) as player_count
                    FROM nba_stats 
                    WHERE team IS NOT NULL
                    GROUP BY team 
                    ORDER BY player_count DESC
                """)
                team_distribution = cursor.fetchall()
                
                return {
                    'total_players': total_players,
                    'top_players': top_players,
                    'team_distribution': team_distribution
                }
        except Exception as e:
            logger.error(f"Failed to get stats summary: {e}")
            return {}


def main():
    """Main function to run the import process."""
    # Get database connection string from environment variable
    connection_string = os.getenv('NEON_DATABASE_URL')
    
    if not connection_string:
        logger.error("NEON_DATABASE_URL environment variable not set")
        logger.info("Please set your Neon database connection string:")
        logger.info("export NEON_DATABASE_URL='postgresql://username:password@host:port/database'")
        return False
    
    # Initialize importer
    importer = NBAStatsImporter(connection_string)
    
    try:
        # Connect to database
        if not importer.connect():
            return False
        
        # Get CSV file path
        csv_file_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'stats', 'nba-stats.csv')
        
        # Import data
        logger.info("Starting NBA stats import...")
        if importer.import_csv(csv_file_path):
            logger.info("Import completed successfully!")
            
            # Show summary
            summary = importer.get_stats_summary()
            if summary:
                logger.info(f"Total players imported: {summary.get('total_players', 0)}")
                logger.info("Top 5 players by fantasy points:")
                for player in summary.get('top_players', []):
                    logger.info(f"  {player['player']} ({player['team']}) - {player['fpts_total']} FPTS")
        else:
            logger.error("Import failed!")
            return False
            
    finally:
        importer.disconnect()
    
    return True


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

