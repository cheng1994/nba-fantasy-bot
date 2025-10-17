import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env.mjs'

// Import all schemas
import { resources } from './schema/resources'
import { embeddings } from './schema/embeddings'
import { nbaStats } from './schema/nba-stats'
import { fantasyTeams, teamRosters } from './schema/fantasy-teams'
import { playerWishlist } from './schema/wishlist'

const client = postgres(env.DATABASE_URL)
export const db = drizzle(client, {
    schema: {
        resources,
        embeddings,
        nbaStats,
        fantasyTeams,
        teamRosters,
        playerWishlist,
    },
})

// Export all schemas for easy access
export * from './schema/resources'
export * from './schema/embeddings'
export * from './schema/nba-stats'
export * from './schema/fantasy-teams'
export * from './schema/wishlist'
