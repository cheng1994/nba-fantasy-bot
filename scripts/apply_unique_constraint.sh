#!/bin/bash
# Apply unique constraint to nba_stats table using TypeScript/Node.js
# This will remove any duplicate records and add a unique constraint

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run the TypeScript version which uses the existing database connection setup
echo "Running unique constraint application using TypeScript..."
echo ""

# Use tsx to run the TypeScript file directly
npx tsx "$SCRIPT_DIR/apply_unique_constraint.ts"

