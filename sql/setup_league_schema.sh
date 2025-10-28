#!/bin/bash

# Setup League Schema for NBA Fantasy Bot
# This script creates all league tables and helper functions

set -e  # Exit on error

echo "🏀 Setting up League Database Schema..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "   Please export DATABASE_URL='postgresql://user:pass@host:port/db'"
    exit 1
fi

echo "✅ Database URL configured"
echo ""

# Run SQL files in order
echo "📝 Creating league tables..."
psql "$DATABASE_URL" -f sql/create_league_tables.sql

echo ""
echo "🔧 Creating helper functions..."
psql "$DATABASE_URL" -f sql/league_helper_functions.sql

echo ""
echo "✅ League schema setup complete!"
echo ""
echo "📊 To verify the installation, run:"
echo "   psql \"\$DATABASE_URL\" -c \"SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('leagues', 'league_memberships', 'weekly_matchups', 'weekly_lineups');\""
echo ""
echo "📚 For full documentation, see:"
echo "   sql/README_LEAGUE_SCHEMA.md"
echo ""

