-- Migration script to add unique constraint to nba_news table
-- This should be run to fix the ON CONFLICT error in the Python script

-- First, remove any potential duplicate entries (keeping the most recent one)
WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY title, published_at ORDER BY created_at DESC) as rn
    FROM nba_news
)
DELETE FROM nba_news 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Add the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_nba_news_unique_article ON nba_news(title, published_at);

-- Verify the constraint was created
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'nba_news' 
AND indexname = 'idx_nba_news_unique_article';
