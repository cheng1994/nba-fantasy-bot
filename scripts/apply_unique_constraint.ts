#!/usr/bin/env tsx
/**
 * Apply unique constraint to nba_stats table
 * This script removes any duplicate records and adds a unique constraint
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../src/lib/env.mjs'
import { sql } from 'drizzle-orm'

const runConstraint = async () => {
    if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined in environment variables')
    }

    console.log('Applying unique constraint to nba_stats table...')
    console.log('This will remove any duplicate records and add a unique constraint on (player_id, season, team)')
    console.log('')

    const connection = postgres(env.DATABASE_URL, { max: 1 })
    const db = drizzle(connection)

    try {
        console.log('⏳ Removing duplicate records...')
        
        // Remove any existing duplicates (keeping the most recent one)
        await db.execute(sql`
            DELETE FROM nba_stats a USING nba_stats b
            WHERE a.id < b.id 
              AND a.player_id = b.player_id 
              AND a.season = b.season 
              AND a.team = b.team
        `)

        console.log('⏳ Adding unique constraint...')
        
        // Add unique constraint
        await db.execute(sql`
            ALTER TABLE nba_stats 
            ADD CONSTRAINT unique_player_season_team 
            UNIQUE (player_id, season, team)
        `)

        console.log('')
        console.log('✅ Unique constraint applied successfully!')
        console.log('')
        console.log('You can now safely run the import script multiple times:')
        console.log('python3 scripts/import_nba_stats.py')
        
    } catch (error: any) {
        if (error.code === '23505' && error.constraint === 'unique_player_season_team') {
            console.log('✅ Unique constraint already exists!')
            console.log('The database is already set up for safe imports.')
        } else {
            console.error('❌ Failed to apply unique constraint:', error.message)
            throw error
        }
    } finally {
        await connection.end()
    }

    process.exit(0)
}

runConstraint().catch((err) => {
    console.error('❌ Constraint application failed:', err.message)
    process.exit(1)
})
