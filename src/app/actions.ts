import { db } from "@/lib/db";
import { openai } from "@ai-sdk/openai"
import { generateObject, tool } from "ai"
// import { sql } from "drizzle-orm";
import { sql } from "@vercel/postgres";
import { Result } from "drizzle-orm/sqlite-core";
import { z } from "zod";

export const queryDatabaseTool = tool({
    description: "Query the database to get information about the NBA",
    inputSchema: z.object({
        query: z.string().describe('The SQL query to execute.'),
    }),
    execute: async ({ query }) => {
      debugger;
        console.log('Executing query:', query);
        const data = await runGenerateSQLQuery(query);
        console.log('Data:', data);
        return data as any; 
    },
})

export const generateQuery = async (input: string) => {
    "use server";

    try {
        const result = await generateObject({
            model: openai('gpt-4o'),
            system: `You are a helpful assistant that can answer questions and help with tasks, regarding NBA fantasy basketball.
            
            You are able to access a SQL (postgress database) to get information about the NBA. The data stored is from the 2024-2025 NBA season.
            Use the following table names:
            - nba_stats
        
            The table has the following schema:
            
            nba_stats (
                id SERIAL PRIMARY KEY,
                season INTEGER NOT NULL,
                league VARCHAR(10) NOT NULL,
                player VARCHAR(100) NOT NULL,
                player_id VARCHAR(20) NOT NULL,
                age INTEGER,
                team VARCHAR(10),
                position VARCHAR(5),
                fpts_total DECIMAL(10,2),
                fpts DECIMAL(10,2),
                games INTEGER,
                games_started INTEGER,
                minutes_played INTEGER,
                fg_made INTEGER,
                fg_attempted INTEGER,
                fg_percentage DECIMAL(5,3),
                x3p_made INTEGER,
                x3p_attempted INTEGER,
                x3p_percentage DECIMAL(5,3),
                x2p_made INTEGER,
                x2p_attempted INTEGER,
                x2p_percentage DECIMAL(5,3),
                e_fg_percentage DECIMAL(5,3),
                ft_made INTEGER,
                ft_attempted INTEGER,
                ft_percentage DECIMAL(5,3),
                offensive_rebounds INTEGER,
                defensive_rebounds INTEGER,
                total_rebounds INTEGER,
                assists INTEGER,
                steals INTEGER,
                blocks INTEGER,
                turnovers INTEGER,
                personal_fouls INTEGER,
                points INTEGER,
                triple_doubles INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        
            Only retrival queries are allowed.
        
            fpts_total is the total fantasy points for the player.
            fpts is the fantasy points for the player for the current season.
            games is the number of games the player has played.
            games_started is the number of games the player has started.Use the following columns:
            - nba_stats:
                - season
                - league
                - player
                - player_id
                - age
                - team
                - position
                - fpts_total
                - fpts
                - games
                - games_started
                - minutes_played
                - fg_made
                - fg_attempted
                - fg_percentage
                - x3p_made
                - x3p_attempted
                - x3p_percentage
                - x2p_made
                - x2p_attempted
                - x2p_percentage
                - e_fg_percentage
                - ft_made
            minutes_played is the number of minutes the player has played.
            fg_made is the number of field goals made.
            fg_attempted is the number of field goals attempted.
            fg_percentage is the percentage of field goals made.
            x3p_made is the number of 3-point field goals made.
            x3p_attempted is the number of 3-point field goals attempted.
            x3p_percentage is the percentage of 3-point field goals made.
            x2p_made is the number of 2-point field goals made.
            x2p_attempted is the number of 2-point field goals attempted.
            x2p_percentage is the percentage of 2-point field goals made.
            e_fg_percentage is the effective field goal percentage.
            ft_made is the number of free throws made.
            ft_attempted is the number of free throws attempted.
            ft_percentage is the percentage of free throws made.
            offensive_rebounds is the number of offensive rebounds.
            defensive_rebounds is the number of defensive rebounds.
            total_rebounds is the number of rebounds.
            assists is the number of assists.
            steals is the number of steals.
            blocks is the number of blocks.
            turnovers is the number of turnovers.
            personal_fouls is the number of personal fouls.
            points is the number of points.
            triple_doubles is the number of triple doubles.
        
            When answering questions, only use the information from the table.
            If the question is not related to the table, say "I don't know".
            `,
            prompt: `Generate a SQL query to answer the following question: ${input}`,
            schema: z.object({
                query: z.string(),
            })
          });

          return result.object.query
    } catch (error) {
        console.error(error)
        return "Failed to generate query."
    }
}

export const runGenerateSQLQuery = async (query: string) => {
    "use server";
    debugger;
    // Check if the query is a SELECT statement
    if (
      !query.trim().toLowerCase().startsWith("select") ||
      query.trim().toLowerCase().includes("drop") ||
      query.trim().toLowerCase().includes("delete") ||
      query.trim().toLowerCase().includes("insert") ||
      query.trim().toLowerCase().includes("update") ||
      query.trim().toLowerCase().includes("alter") ||
      query.trim().toLowerCase().includes("truncate") ||
      query.trim().toLowerCase().includes("create") ||
      query.trim().toLowerCase().includes("grant") ||
      query.trim().toLowerCase().includes("revoke")
    ) {
      throw new Error("Only SELECT queries are allowed");
    }
  
    let data: any;
    try {
      data = await sql.query(query);
      console.log('Data returned:', data);
    } catch (e: any) {
      if (e.message.includes('relation "unicorns" does not exist')) {
        console.log(
          "Table does not exist, creating and seeding it with dummy data now...",
        );
        // throw error
        throw Error("Table does not exist");
      } else {
        throw e;
      }
    }
  
    return data.rows as Result<any, any>[];
}