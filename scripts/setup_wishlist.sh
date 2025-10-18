#!/bin/bash

# Setup script for Player Wishlist feature
# This creates the player_wishlist table in the database

set -e

echo "🎯 Setting up Player Wishlist feature..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it with: export DATABASE_URL='your_database_url'"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

echo "📊 Creating player_wishlist table..."
psql "$DATABASE_URL" -f sql/create_player_wishlist_table.sql

if [ $? -eq 0 ]; then
    echo "✅ Player Wishlist table created successfully!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "You can now:"
    echo "  • Add players to wishlists via the API: POST /api/wishlist"
    echo "  • Get wishlist: GET /api/wishlist?season=2025"
    echo "  • Update priority: PATCH /api/wishlist"
    echo "  • Remove from wishlist: DELETE /api/wishlist?id=123"
    echo ""
    echo "The AI chat assistant will automatically consider wishlisted players"
    echo "when making draft recommendations and boost their rankings!"
else
    echo "❌ Error creating player_wishlist table"
    exit 1
fi

