import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { sql } from "@vercel/postgres";
import { z } from "zod";

// Types for NBA news
export interface NBANewsItem {
  id?: number;
  player_name?: string;
  player_id?: string;
  team?: string;
  title: string;
  content?: string;
  summary?: string;
  category: 'injury' | 'trade' | 'suspension' | 'performance' | 'roster' | 'other';
  severity?: 'minor' | 'moderate' | 'severe' | 'season_ending';
  impact_level?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'resolved' | 'monitoring';
  expected_return_date?: string;
  games_missed?: number;
  source: string;
  source_url?: string;
  author?: string;
  published_at: string;
  tags?: string[];
  affected_stats?: string[];
  fantasy_impact_note?: string;
}

// Schema for news database operations
const NewsItemSchema = z.object({
  player_name: z.string().optional(),
  player_id: z.string().optional(),
  team: z.string().optional(),
  title: z.string(),
  content: z.string().optional(),
  summary: z.string().optional(),
  category: z.enum(['injury', 'trade', 'suspension', 'performance', 'roster', 'other']),
  severity: z.enum(['minor', 'moderate', 'severe', 'season_ending']).optional(),
  impact_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['active', 'resolved', 'monitoring']).optional(),
  expected_return_date: z.string().optional(),
  games_missed: z.number().optional(),
  source: z.string(),
  source_url: z.string().optional(),
  author: z.string().optional(),
  published_at: z.string(),
  tags: z.array(z.string()).optional(),
  affected_stats: z.array(z.string()).optional(),
  fantasy_impact_note: z.string().optional(),
});

// Fetch NBA news from ESPN API
export async function fetchESPNNews(): Promise<NBANewsItem[]> {
  try {
    // ESPN API endpoint for NBA news
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=20',
      {
        headers: {
          'User-Agent': 'NBA-Fantasy-Bot/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    const newsItems: NBANewsItem[] = [];

    for (const article of data.articles || []) {
      // Extract player information from headline/content
      const playerInfo = await extractPlayerInfo(article.headline, article.description);
      
      const newsItem: NBANewsItem = {
        title: article.headline,
        content: article.description,
        summary: article.description?.substring(0, 200) + '...',
        category: 'other', // Will be categorized by AI
        source: 'espn',
        source_url: article.links?.web?.href,
        author: article.byline,
        published_at: article.published,
        tags: [],
        affected_stats: [],
      };

      // Add player info if found
      if (playerInfo) {
        newsItem.player_name = playerInfo.name;
        newsItem.player_id = playerInfo.id;
        newsItem.team = playerInfo.team;
      }

      newsItems.push(newsItem);
    }

    return newsItems;
  } catch (error) {
    console.error('Error fetching ESPN news:', error);
    return [];
  }
}

// Fetch NBA news from NBA.com API
export async function fetchNBANews(): Promise<NBANewsItem[]> {
  try {
    // NBA.com API endpoint
    const response = await fetch(
      'https://www.nba.com/news',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.nba.com/',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`NBA API error: ${response.status}`);
    }

    const data = await response.json();
    const newsItems: NBANewsItem[] = [];

    // Process NBA API response format
    for (const article of data.result || []) {
      const playerInfo = await extractPlayerInfo(article.title, article.summary);
      
      const newsItem: NBANewsItem = {
        title: article.title,
        content: article.summary,
        summary: article.summary?.substring(0, 200) + '...',
        category: 'other',
        source: 'nba',
        source_url: article.url,
        author: article.author,
        published_at: article.publishedDate,
        tags: [],
        affected_stats: [],
      };

      if (playerInfo) {
        newsItem.player_name = playerInfo.name;
        newsItem.player_id = playerInfo.id;
        newsItem.team = playerInfo.team;
      }

      newsItems.push(newsItem);
    }

    return newsItems;
  } catch (error) {
    console.error('Error fetching NBA news:', error);
    return [];
  }
}

// Extract player information from text using AI
async function extractPlayerInfo(headline: string, content?: string): Promise<{name: string, id?: string, team?: string} | null> {
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      prompt: `Extract NBA player information from this news headline and content. Return null if no specific player is mentioned.

Headline: ${headline}
Content: ${content || ''}

Look for player names and try to match them to NBA players. Also try to extract team information if mentioned.`,
      schema: z.object({
        player_name: z.string().nullable().describe('The NBA player name if found'),
        player_id: z.string().nullable().describe('Player ID if determinable'),
        team: z.string().nullable().describe('Team abbreviation if mentioned'),
        found: z.boolean().describe('Whether a specific player was found'),
      }),
    });

    if (result.object.found && result.object.player_name) {
      return {
        name: result.object.player_name,
        id: result.object.player_id || undefined,
        team: result.object.team || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting player info:', error);
    return null;
  }
}

// Categorize and analyze news using AI
async function categorizeAndAnalyzeNews(newsItem: NBANewsItem): Promise<NBANewsItem> {
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      prompt: `Analyze this NBA news item and categorize it for fantasy basketball impact.

Title: ${newsItem.title}
Content: ${newsItem.content || ''}
Player: ${newsItem.player_name || 'Unknown'}

Categorize this news as one of: injury, trade, suspension, performance, roster, other
If it's an injury, determine severity: minor, moderate, severe, season_ending
Assess fantasy impact: low, medium, high, critical
If it's an injury, estimate games missed and expected return timeline.
Generate a fantasy impact note explaining how this affects the player's fantasy value.`,
      schema: z.object({
        category: z.enum(['injury', 'trade', 'suspension', 'performance', 'roster', 'other']),
        severity: z.enum(['minor', 'moderate', 'severe', 'season_ending']).optional(),
        impact_level: z.enum(['low', 'medium', 'high', 'critical']),
        status: z.enum(['active', 'resolved', 'monitoring']).optional(),
        expected_return_date: z.string().nullable().optional(),
        games_missed: z.number().nullable().optional(),
        tags: z.array(z.string()).describe('Relevant tags like injury type, status, etc.'),
        affected_stats: z.array(z.string()).describe('Fantasy stats that might be affected'),
        fantasy_impact_note: z.string().describe('Detailed analysis of fantasy impact'),
      }),
    });

    return {
      ...newsItem,
      category: result.object.category,
      severity: result.object.severity,
      impact_level: result.object.impact_level,
      status: result.object.status,
      expected_return_date: result.object.expected_return_date || undefined,
      games_missed: result.object.games_missed || undefined,
      tags: result.object.tags,
      affected_stats: result.object.affected_stats,
      fantasy_impact_note: result.object.fantasy_impact_note,
    };
  } catch (error) {
    console.error('Error categorizing news:', error);
    return newsItem;
  }
}

// Save news item to database
export async function saveNewsItem(newsItem: NBANewsItem): Promise<boolean> {
  try {
    const analyzedItem = await categorizeAndAnalyzeNews(newsItem);
    
    const query = `
      INSERT INTO nba_news (
        player_name, player_id, team, title, content, summary,
        category, severity, impact_level, status, expected_return_date,
        games_missed, source, source_url, author, published_at,
        tags, affected_stats, fantasy_impact_note
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      ON CONFLICT (title, published_at) DO NOTHING
    `;

    await sql.query(query, [
      analyzedItem.player_name,
      analyzedItem.player_id,
      analyzedItem.team,
      analyzedItem.title,
      analyzedItem.content,
      analyzedItem.summary,
      analyzedItem.category,
      analyzedItem.severity,
      analyzedItem.impact_level,
      analyzedItem.status,
      analyzedItem.expected_return_date,
      analyzedItem.games_missed,
      analyzedItem.source,
      analyzedItem.source_url,
      analyzedItem.author,
      analyzedItem.published_at,
      analyzedItem.tags,
      analyzedItem.affected_stats,
      analyzedItem.fantasy_impact_note,
    ]);

    return true;
  } catch (error) {
    console.error('Error saving news item:', error);
    return false;
  }
}

// Fetch and save all NBA news
export async function fetchAndSaveAllNews(): Promise<number> {
  let totalSaved = 0;

  try {
    // Fetch from multiple sources
    const [espnNews, nbaNews] = await Promise.all([
      fetchESPNNews(),
      fetchNBANews(),
    ]);

    const allNews = [...espnNews, ...nbaNews];

    // Save each news item
    for (const newsItem of allNews) {
      const saved = await saveNewsItem(newsItem);
      if (saved) {
        totalSaved++;
      }
    }

    console.log(`Successfully saved ${totalSaved} news items`);
    return totalSaved;
  } catch (error) {
    console.error('Error fetching and saving news:', error);
    return totalSaved;
  }
}

// Tool for AI agent to query NBA news
export const queryNBANewsTool = tool({
  description: "Query the NBA news database for recent injuries, trades, and other events affecting fantasy performance",
  inputSchema: z.object({
    query: z.string().describe('The SQL query to execute on the nba_news table'),
  }),
  execute: async ({ query }) => {
    try {
      // Validate that it's a SELECT query
      if (
        !query.trim().toLowerCase().startsWith("select") ||
        query.trim().toLowerCase().includes("drop") ||
        query.trim().toLowerCase().includes("delete") ||
        query.trim().toLowerCase().includes("insert") ||
        query.trim().toLowerCase().includes("update") ||
        query.trim().toLowerCase().includes("alter") ||
        query.trim().toLowerCase().includes("truncate") ||
        query.trim().toLowerCase().includes("create")
      ) {
        throw new Error("Only SELECT queries are allowed");
      }

      const data = await sql.query(query);
      console.log('NBA News query result:', data);
      return data.rows;
    } catch (error) {
      console.error('Error querying NBA news:', error);
      throw error;
    }
  },
});

// Get recent news for a specific player
export async function getPlayerNews(playerName: string, days: number = 7): Promise<NBANewsItem[]> {
  try {
    const query = `
      SELECT * FROM nba_news 
      WHERE LOWER(player_name) LIKE LOWER($1) 
        AND published_at >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY published_at DESC
    `;
    
    const result = await sql.query(query, [`%${playerName}%`]);
    return result.rows as NBANewsItem[];
  } catch (error) {
    console.error('Error fetching player news:', error);
    return [];
  }
}

// Get active injuries
export async function getActiveInjuries(): Promise<NBANewsItem[]> {
  try {
    const query = `
      SELECT * FROM active_injuries 
      ORDER BY impact_level DESC, published_at DESC
    `;
    
    const result = await sql.query(query);
    return result.rows as NBANewsItem[];
  } catch (error) {
    console.error('Error fetching active injuries:', error);
    return [];
  }
}
