import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env.mjs'

// Import all schemas
import { resources } from './schema/resources'
import { embeddings } from './schema/embeddings'

const client = postgres(env.DATABASE_URL)
export const db = drizzle(client, {
    schema: {
        resources,
        embeddings,
    },
})

// Export all schemas for easy access
export * from './schema/resources'
export * from './schema/embeddings'
