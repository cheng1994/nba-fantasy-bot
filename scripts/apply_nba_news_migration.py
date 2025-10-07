#!/usr/bin/env python3
"""
Script to apply the unique constraint migration to the nba_news table.
Run this script once to fix the ON CONFLICT error.
"""

import os
import sys
import psycopg2
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def apply_migration():
    """Apply the unique constraint migration"""
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        logger.error("DATABASE_URL environment variable is required")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        logger.info("Starting migration to add unique constraint...")
        
        # First, remove any potential duplicate entries (keeping the most recent one)
        logger.info("Removing duplicate entries...")
        cursor.execute("""
            WITH duplicates AS (
                SELECT id, 
                       ROW_NUMBER() OVER (PARTITION BY title, published_at ORDER BY created_at DESC) as rn
                FROM nba_news
            )
            DELETE FROM nba_news 
            WHERE id IN (
                SELECT id FROM duplicates WHERE rn > 1
            )
        """)
        
        deleted_count = cursor.rowcount
        logger.info(f"Removed {deleted_count} duplicate entries")
        
        # Add the unique constraint
        logger.info("Adding unique constraint...")
        cursor.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_nba_news_unique_article 
            ON nba_news(title, published_at)
        """)
        
        # Verify the constraint was created
        cursor.execute("""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'nba_news' 
            AND indexname = 'idx_nba_news_unique_article'
        """)
        
        result = cursor.fetchone()
        if result:
            logger.info(f"Unique constraint created successfully: {result[0]}")
        else:
            logger.error("Failed to create unique constraint")
            sys.exit(1)
        
        conn.commit()
        logger.info("Migration completed successfully!")
        
    except Exception as e:
        logger.error(f"Error applying migration: {e}")
        if 'conn' in locals():
            conn.rollback()
        sys.exit(1)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    apply_migration()
