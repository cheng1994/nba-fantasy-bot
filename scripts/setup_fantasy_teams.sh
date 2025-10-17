#!/bin/bash

# Setup script for Fantasy Teams feature
# This script creates the necessary database tables for managing fantasy basketball teams

set -e  # Exit on error

echo "🏀 Setting up Fantasy Teams tables..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it with: export DATABASE_URL='your_postgres_connection_string'"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Run the SQL migration
echo "📝 Creating fantasy_teams and team_rosters tables..."
psql "$DATABASE_URL" -f sql/create_fantasy_teams_tables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Fantasy Teams tables created successfully!"
    echo ""
    echo "Tables created:"
    echo "  - fantasy_teams (stores team information)"
    echo "  - team_rosters (stores 13-player rosters)"
    echo ""
    echo "Next steps:"
    echo "  1. Review the schema in: src/lib/db/schema/fantasy-teams.ts"
    echo "  2. Use the actions in: src/lib/actions/fantasy-teams.ts"
    echo "  3. Read the documentation: src/lib/actions/README_FANTASY_TEAMS.md"
    echo ""
    echo "Example usage:"
    echo "  import { createFantasyTeam, addPlayerToRoster } from '@/lib/actions/fantasy-teams';"
    echo ""
else
    echo ""
    echo "❌ Error: Failed to create tables"
    echo "Please check your DATABASE_URL and try again"
    exit 1
fi

