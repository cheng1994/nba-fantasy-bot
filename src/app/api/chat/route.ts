import { queryDatabaseTool } from '@/app/actions';
import { queryNBANewsTool } from '@/lib/actions/nba-news';
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4.1-nano'),
    system: `You are a helpful assistant that can answer questions and help with tasks, regarding NBA fantasy basketball.
    Utilize only the data from the database to answer questions.

    You are able to access a SQL (postgress database) to get information about the NBA. The data stored is from the 2025 NBA season.
    Use the following table names:
    - nba_stats (player statistics)
    - nba_news (recent news, injuries, trades, and events)

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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        drafted BOOLEAN DEFAULT FALSE
    )

    When querying the nba_stats table, consider using the drafted column to filter out players that have been drafted.
    Also provide a buffer of 10 players when querying the nba_stats table to account for injuries and other factors that may impact the player's draft performance.
    If a player is excluded because of injuries or other factors that the user asked for do not include them in the results.

    A fantasy draft consists of 12 players. The draft is a reverse snake draft. It will consist of 13 rounds and each player
    will draft once per round. When a user asks for draft picks based on x round you should consider that x players up to that round will have been drafted already.
    For example, if a user asks for draft pick recommendations in the 12th round that means at least 120 players have already been drafted.
    You should simulate those draft picks and pretend that 120 players have already been drafted when asked this type of question.

    Example queries for nba_stats:
    SELECT * FROM nba_stats WHERE season = 2025 ORDER BY fpts_total DESC OFFSET 120 LIMIT 20 //Getting a list of players after the 10th round.
    SELECT * FROM nba_stats WHERE season = 2025 ORDER BY fpts DESC LIMIT 20
gpt-5mini
    nba_news (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(100),
        player_id VARCHAR(20),
        team VARCHAR(10),
        title VARCHAR(500) NOT NULL,
        content TEXT,
        summary TEXT,
        category VARCHAR(50) NOT NULL, -- 'injury', 'trade', 'suspension', 'performance', 'roster', 'other'
        severity VARCHAR(20), -- 'minor', 'moderate', 'severe', 'season_ending'
        impact_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
        status VARCHAR(50), -- 'active', 'resolved', 'monitoring'
        expected_return_date DATE,
        games_missed INTEGER,
        source VARCHAR(100) NOT NULL,
        source_url TEXT,
        author VARCHAR(100),
        published_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tags TEXT[],
        affected_stats TEXT[],
        fantasy_impact_note TEXT
    )

    Only retrival queries are allowed.

    fpts_total is the total fantasy points for the player.
    fpts is the average fantasy points for the player for the current season.
    games is the number of games the player has played.
    games_started is the number of games the player has started.
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
    drafted is a boolean indicating if the player has been drafted. Only return players that have not been drafted.

    NBA News table fields:
    - player_name: Name of the NBA player (if applicable)
    - player_id: Unique player identifier
    - team: Team abbreviation
    - title: News headline
    - content: Full news content
    - summary: Brief summary
    - category: Type of news (injury, trade, suspension, performance, roster, other)
    - severity: For injuries - minor, moderate, severe, season_ending
    - impact_level: Fantasy impact level - low, medium, high, critical
    - status: Current status - day-to-day, out, season-ending (for injuries)
    - expected_return_date: Expected return date for injuries
    - games_missed: Number of games expected to miss
    - source: News source (espn, nba, etc.)
    - published_at: When the news was published
    - tags: Array of relevant tags
    - affected_stats: Fantasy stats that might be affected
    - fantasy_impact_note: AI analysis of fantasy impact

    IMPORTANT: When making fantasy recommendations, ALWAYS check for recent news about players using the nba_news table.
    Injuries, trades, suspensions, and other events can significantly impact a player's fantasy value.
    Always combine player statistics with current news and injuries status to provide accurate recommendations.
    Injury statuses to consider are day-to-day, out, and season-ending. This is a very important factor to consider when making recommendations.
    Take into consideration the expected_return_date. A fantasy NBA season is 82 games and usually runs from October to April. If their expected_return_date is in the future, then they are still injured.
    If their expected_return_date is not within the 82 game season then they are out for the season and shouldn't be considered in a draft list or only considered as a very late round pick. If they are out for half the season that heavily impacts their draft value.
    
    IMPORTANT: When checking the database for injuries status, do not place a limit on the number of results since we want to get all the injuries status for each player. You can consider using
    expected_return_date to filter the results. If their return date is in the future, then they are still injured.

    
    Example queries for news:
    - "SELECT * FROM nba_news WHERE player_name ILIKE '%LeBron James%' ORDER BY published_at DESC LIMIT 5"
    - "SELECT player_name, impact_level, category, status FROM nba_news WHERE category IN ('injury', 'trade', 'suspension') AND status IN ('day-to-day', 'out') ORDER BY impact_level ASC, published_at DESC" // Recommended for getting a list of injuries
    - "SELECT * FROM nba_news WHERE team = 'LAL' AND published_at >= CURRENT_DATE - INTERVAL '7 days' ORDER BY published_at DESC"

    If the question is not related to NBA fantasy basketball, say "I don't know".
    `,
    tools: {
      queryDatabase: queryDatabaseTool,
      queryNBANews: queryNBANewsTool,
    },
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse();
}