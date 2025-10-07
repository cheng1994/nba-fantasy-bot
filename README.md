# NBA Fantasy Basketball Bot

An intelligent AI-powered fantasy basketball assistant that helps you make informed decisions by analyzing NBA player statistics and recent news, including injuries, trades, and other events that impact fantasy performance.

## Features

### 🏀 Player Statistics Analysis
- Comprehensive NBA player statistics from the 2025 season
- Fantasy points analysis and projections
- Performance metrics across all categories
- Historical data and trends

### 📰 Real-Time News Integration
- **NEW**: Recent NBA news and injury updates
- AI-powered analysis of fantasy impact
- Injury severity assessment and return timelines
- Trade and roster change notifications
- Suspension and performance alerts

### 🤖 Intelligent Recommendations
- AI agent that considers both statistics and current events
- Context-aware fantasy advice
- Draft strategy recommendations
- Waiver wire suggestions
- Trade analysis

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- OpenAI API key
- Python 3.8+ (for news fetching)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd nba-fantasy-bot
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Add your configuration:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **Set up the database**:
   ```bash
   # Create NBA stats table
   psql $DATABASE_URL -f sql/create_nba_stats_table.sql
   
   # Import NBA statistics
   cd scripts
   ./setup_and_import.sh
   ```

4. **Set up news integration**:
   ```bash
   cd scripts
   ./setup_news_fetch.sh
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to start using the bot.

## Usage

### Chat with the AI Agent

The AI agent can help you with:
- **Player analysis**: "How is LeBron James performing this season?"
- **Injury updates**: "Are there any injured players I should avoid?"
- **Draft recommendations**: "Who should I draft in the first round?"
- **Trade analysis**: "Is this trade fair for my team?"
- **Waiver wire**: "Who are the best available free agents?"

### Example Queries

```
"Show me the top 10 fantasy players this season"
"What's the latest news about Anthony Davis?"
"Are there any players with recent injuries I should be concerned about?"
"Compare the fantasy value of Luka Doncic vs. Nikola Jokic"
"Who are the best sleepers for next week?"
```

## News Integration

The bot now includes real-time NBA news integration:

### Sources
- ESPN NBA news API
- NBA.com official news
- AI-powered impact analysis

### Features
- **Injury tracking**: Severity assessment and return timelines
- **Trade alerts**: Real-time trade notifications and analysis
- **Suspension updates**: League and team discipline tracking
- **Performance news**: Recent performance trends and updates
- **Fantasy impact**: AI-generated analysis of how news affects player value

### Automatic Updates

Set up regular news fetching:
```bash
# Add to crontab for hourly updates
0 * * * * cd /path/to/nba-fantasy-bot/scripts && python3 fetch_nba_news.py
```

## Database Schema

### NBA Stats Table
- Player statistics and performance metrics
- Fantasy points and projections
- Game logs and advanced analytics

### NBA News Table (NEW)
- Recent news and events
- Injury tracking and severity
- Trade and roster updates
- AI-generated fantasy impact analysis

## API Endpoints

- `POST /api/chat` - Chat with the AI agent
- Database query tools for statistics and news

## Development

### Project Structure
```
src/
├── app/                 # Next.js app directory
│   ├── api/chat/       # Chat API endpoint
│   └── actions.ts      # Database tools
├── lib/
│   ├── actions/        # Action functions
│   │   └── nba-news.ts # News integration
│   └── db/            # Database configuration
scripts/
├── fetch_nba_news.py   # News fetching script
├── setup_news_fetch.sh # News setup script
└── README_NEWS.md      # News integration docs
sql/
└── create_nba_news_table.sql # News database schema
```

### Adding New Features

1. **New data sources**: Add to `fetch_nba_news.py`
2. **New analysis types**: Extend AI prompts in news categorization
3. **New tools**: Add to `actions.ts` and update agent system prompt

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Environment Variables for Production
- `DATABASE_URL`: Production PostgreSQL connection
- `OPENAI_API_KEY`: OpenAI API key
- Set up cron jobs for news fetching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the documentation in `scripts/README_NEWS.md`
2. Review the troubleshooting section
3. Open an issue on GitHub

---

**Note**: This bot is for educational and entertainment purposes. Always verify information and make your own informed decisions for fantasy basketball.
