# NBA News Integration

This directory contains scripts and tools for integrating NBA news, injuries, and events into the fantasy basketball bot.

## Overview

The NBA news integration allows the AI agent to:
- Fetch recent NBA news from ESPN and NBA.com
- Analyze news for fantasy impact using AI
- Store categorized news in a database
- Use news data to make better fantasy recommendations
- Consider injuries, trades, suspensions, and other events

## Files

- `fetch_nba_news.py` - Main script to fetch and process NBA news
- `setup_news_fetch.sh` - Setup script to initialize the news system
- `../sql/create_nba_news_table.sql` - Database schema for NBA news
- `../src/lib/actions/nba-news.ts` - TypeScript functions for news operations
- `requirements.txt` - Updated with news fetching dependencies

## Quick Start

1. **Set environment variables**:
   ```bash
   export DATABASE_URL='postgresql://username:password@host:port/database'
   export OPENAI_API_KEY='your-openai-api-key'
   ```

2. **Run the setup script**:
   ```bash
   ./setup_news_fetch.sh
   ```

3. **Test the integration**:
   Ask the AI agent about a player's recent news or injuries.

## Database Schema

The `nba_news` table stores:
- Player information (name, ID, team)
- News content (title, content, summary)
- Categorization (injury, trade, suspension, etc.)
- Impact analysis (severity, fantasy impact level)
- Status tracking (active, resolved, monitoring)
- Return timeline (expected return date, games missed)
- Source information (source, URL, author)
- AI analysis (tags, affected stats, fantasy impact note)

## Regular Updates

To keep news data fresh, set up a cron job:

```bash
# Fetch news every 6 hours
0 */6 * * * cd /path/to/nba-fantasy-bot/scripts && python3 fetch_nba_news.py

# Or fetch news every hour during NBA season
0 * * * * cd /path/to/nba-fantasy-bot/scripts && python3 fetch_nba_news.py
```

## AI Agent Integration

The AI agent now has access to:
- `queryDatabase` tool for player statistics
- `queryNBANews` tool for recent news and injuries

Example queries the agent can make:
```sql
-- Get recent news for a player
SELECT * FROM nba_news WHERE player_name ILIKE '%LeBron James%' ORDER BY published_at DESC LIMIT 5;

-- Get active injuries
SELECT * FROM nba_news WHERE category = 'injury' AND status = 'active' ORDER BY impact_level DESC;

-- Get recent team news
SELECT * FROM nba_news WHERE team = 'LAL' AND published_at >= CURRENT_DATE - INTERVAL '7 days';
```

## Features

### News Sources
- ESPN NBA news API
- NBA.com official news
- Extensible for additional sources

### AI Analysis
- Player name extraction from headlines
- News categorization (injury, trade, suspension, etc.)
- Severity assessment for injuries
- Fantasy impact analysis
- Return timeline estimation

### Data Management
- Automatic deduplication
- Old news cleanup (configurable retention)
- Error handling and retry logic
- Comprehensive logging

## Troubleshooting

### Common Issues

1. **API Rate Limits**: The script includes retry logic with exponential backoff
2. **Database Connection**: Ensure DATABASE_URL is correct and accessible
3. **OpenAI API**: Verify OPENAI_API_KEY is valid and has sufficient credits
4. **Missing Dependencies**: Run `pip3 install -r requirements.txt`

### Logs
Check the `nba_news_fetch.log` file for detailed execution logs.

### Manual Testing
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM nba_news;"

# Test OpenAI API
python3 -c "import openai; print('OpenAI API key is valid')"

# Run a single fetch
python3 fetch_nba_news.py
```

## Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for AI analysis

### Customization
- Modify `fetch_nba_news.py` to add new news sources
- Adjust AI prompts for different analysis styles
- Configure cleanup retention period
- Add custom categorization logic

## Fantasy Impact Categories

### Injury Severity
- **Minor**: 1-3 games missed, minimal fantasy impact
- **Moderate**: 1-2 weeks, moderate fantasy impact
- **Severe**: 2-6 weeks, significant fantasy impact
- **Season Ending**: Rest of season, major fantasy impact

### Impact Levels
- **Low**: Minimal effect on fantasy performance
- **Medium**: Noticeable effect on some categories
- **High**: Significant effect on multiple categories
- **Critical**: Major effect on overall fantasy value

### Categories
- **Injury**: Player health issues
- **Trade**: Player trades and roster moves
- **Suspension**: League or team suspensions
- **Performance**: Performance-related news
- **Roster**: Roster changes and lineup updates
- **Other**: General NBA news

## Future Enhancements

- Integration with injury tracking APIs
- Real-time news alerts
- Machine learning for better impact prediction
- Social media sentiment analysis
- Advanced analytics and trends
