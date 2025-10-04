#!/bin/bash

# NBA Stats Import Setup Script
# This script sets up the environment and imports NBA stats into Neon database

set -e  # Exit on any error

echo "🏀 NBA Stats Import Setup"
echo "========================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Check if NEON_DATABASE_URL is set
if [ -z "$NEON_DATABASE_URL" ]; then
    echo "❌ NEON_DATABASE_URL environment variable is not set."
    echo ""
    echo "Please set your Neon database connection string:"
    echo "export NEON_DATABASE_URL='postgresql://username:password@host:port/database'"
    echo ""
    echo "You can get your connection string from the Neon console:"
    echo "https://console.neon.tech/"
    exit 1
fi

echo "✅ Environment setup complete!"
echo ""

# Run the import script
echo "🚀 Starting NBA stats import..."
python3 import_nba_stats.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Import completed successfully!"
    echo "You can now query your NBA stats in the Neon database."
else
    echo ""
    echo "❌ Import failed. Please check the error messages above."
    exit 1
fi

