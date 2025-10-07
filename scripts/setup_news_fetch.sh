#!/bin/bash

# Setup script for NBA News fetching
# This script sets up the environment and runs the news fetching process

set -e  # Exit on any error

echo "🏀 NBA Fantasy Bot - News Setup Script"
echo "======================================"

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your PostgreSQL database URL:"
    echo "export DATABASE_URL='postgresql://username:password@host:port/database'"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is not set"
    echo "Please set your OpenAI API key:"
    echo "export OPENAI_API_KEY='your-api-key-here'"
    exit 1
fi

echo "✅ Environment variables are set"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Create the NBA news table if it doesn't exist
echo "🗄️  Setting up database table..."
psql $DATABASE_URL -f ../sql/create_nba_news_table.sql

# Run the news fetch script
echo "📰 Fetching NBA news..."
python3 fetch_nba_news.py

echo "✅ NBA news setup completed successfully!"
echo ""
echo "To run news fetching regularly, you can:"
echo "1. Add a cron job: 0 */6 * * * cd $(pwd) && ./setup_news_fetch.sh"
echo "2. Or run manually: python3 fetch_nba_news.py"
echo ""
echo "The news data will now be available to your AI agent for fantasy recommendations."
