#!/usr/bin/env python3
"""
NBA News Fetcher Script

This script fetches NBA news and injury data from various sources and stores it in the database.
It fetches data from:
- ESPN News API for general NBA news
- ESPN Injuries API for detailed injury information
- NBA.com API (currently disabled)

The script uses AI to analyze and categorize news for fantasy basketball impact.
It should be run regularly (e.g., every hour) to keep the news data up to date.

Usage:
    python3 fetch_nba_news.py

Environment Variables:
    - DATABASE_URL: PostgreSQL connection string
    - OPENAI_API_KEY: OpenAI API key for AI analysis
"""
from dotenv import load_dotenv
import os
import sys
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import requests
from dataclasses import dataclass
import psycopg2
from psycopg2.extras import RealDictCursor
import openai
from tenacity import retry, stop_after_attempt, wait_exponential
load_dotenv() # This loads the variables from .env into os.environ

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('nba_news_fetch.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class NewsItem:
    """Represents an NBA news item"""
    player_name: Optional[str] = None
    player_id: Optional[str] = None
    team: Optional[str] = None
    title: str = ""
    content: Optional[str] = None
    summary: Optional[str] = None
    category: str = "other"
    severity: Optional[str] = None
    impact_level: str = "low"
    status: Optional[str] = None
    expected_return_date: Optional[str] = None
    games_missed: Optional[int] = None
    source: str = ""
    source_url: Optional[str] = None
    author: Optional[str] = None
    published_at: str = ""
    tags: List[str] = None
    affected_stats: List[str] = None
    fantasy_impact_note: Optional[str] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.affected_stats is None:
            self.affected_stats = []

class NBANewsFetcher:
    """Fetches NBA news from various sources"""
    
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'NBA-Fantasy-Bot/1.0 (fantasy basketball assistant)'
        })
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_espn_news(self) -> List[NewsItem]:
        """Fetch NBA news from ESPN API"""
        try:
            logger.info("Fetching news from ESPN...")
            url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news"
            params = {'limit': 20}
            
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            news_items = []
            
            for article in data.get('articles', []):
                news_item = NewsItem(
                    title=article.get('headline', ''),
                    content=article.get('description', ''),
                    source='espn',
                    source_url=article.get('links', {}).get('web', {}).get('href'),
                    author=article.get('byline'),
                    published_at=article.get('published', ''),
                )
                
                # Extract summary
                if news_item.content:
                    news_item.summary = news_item.content[:200] + '...' if len(news_item.content) > 200 else news_item.content
                
                news_items.append(news_item)
            
            logger.info(f"Fetched {len(news_items)} items from ESPN")
            return news_items
            
        except Exception as e:
            logger.error(f"Error fetching ESPN news: {e}")
            return []
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_espn_injuries(self) -> List[NewsItem]:
        """Fetch NBA injury data from ESPN API"""
        try:
            logger.info("Fetching injury data from ESPN...")
            url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries"
            
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            news_items = []
            
            # Parse injury data
            for team_data in data.get('injuries', []):
                team_name = team_data.get('displayName', 'Unknown Team')
                team_abbrev = team_data.get('abbreviation', '')
                
                # Handle both direct injuries array and nested structure
                injuries_list = team_data.get('injuries', [])
                if not injuries_list and 'injuries' in team_data:
                    # Sometimes injuries might be nested differently
                    injuries_list = team_data['injuries']
                
                # Skip teams with no injuries
                if not injuries_list:
                    continue
                
                for injury in injuries_list:
                    athlete = injury.get('athlete', {})
                    player_name = athlete.get('displayName', '')
                    player_id = str(athlete.get('id', ''))
                    
                    # Extract injury details
                    status = injury.get('status', '')
                    short_comment = injury.get('shortComment', '')
                    long_comment = injury.get('longComment', '')
                    injury_date = injury.get('date', '')
                    
                    # Get detailed injury information
                    injury_details = injury.get('details', {})
                    if not injury_details and 'details' in injury:
                        injury_details = injury['details']
                    
                    injury_type = injury_details.get('type', '') if injury_details else ''
                    injury_location = injury_details.get('location', '') if injury_details else ''
                    injury_detail = injury_details.get('detail', '') if injury_details else ''
                    return_date = injury_details.get('returnDate', '') if injury_details else ''
                    
                    # Also check for fantasy status in details
                    fantasy_status = None
                    if injury_details and 'fantasyStatus' in injury_details:
                        fantasy_status = injury_details['fantasyStatus'].get('description', '')
                    
                    # Create news item for injury
                    news_item = NewsItem(
                        player_name=player_name,
                        player_id=player_id,
                        team=team_abbrev,
                        title=f"{player_name} Injury Update: {status}",
                        content=long_comment or short_comment,
                        summary=short_comment,
                        category='injury',
                        source='espn_injuries',
                        source_url=f"https://www.espn.com/nba/player/_/id/{player_id}/{player_name.lower().replace(' ', '-')}" if player_id else None,
                        published_at=injury_date,
                        status=status.lower() if status else None,
                        tags=[tag for tag in [injury_type, injury_location, injury_detail] if tag],
                        affected_stats=['minutes', 'points', 'rebounds', 'assists', 'steals', 'blocks']
                    )
                    
                    # Determine severity based on status and fantasy status
                    status_lower = status.lower() if status else ''
                    fantasy_status_lower = fantasy_status.lower() if fantasy_status else ''
                    
                    if 'day-to-day' in status_lower or 'dtd' in status_lower or 'questionable' in fantasy_status_lower:
                        news_item.severity = 'minor'
                        news_item.impact_level = 'low'
                    elif 'out' in status_lower or 'out' in fantasy_status_lower:
                        news_item.severity = 'moderate'
                        news_item.impact_level = 'high'
                    elif 'season' in status_lower or 'season' in fantasy_status_lower:
                        news_item.severity = 'season_ending'
                        news_item.impact_level = 'critical'
                    elif 'doubtful' in fantasy_status_lower:
                        news_item.severity = 'moderate'
                        news_item.impact_level = 'high'
                    else:
                        news_item.severity = 'minor'
                        news_item.impact_level = 'medium'
                    
                    # Set expected return date if available
                    if return_date:
                        try:
                            from datetime import datetime
                            # Parse the return date (assuming it's in YYYY-MM-DD format)
                            parsed_date = datetime.strptime(return_date, '%Y-%m-%d')
                            news_item.expected_return_date = return_date
                        except ValueError:
                            logger.debug(f"Could not parse return date: {return_date}")
                    
                    # Generate fantasy impact note
                    if player_name:
                        news_item.fantasy_impact_note = self._generate_injury_fantasy_note(
                            player_name, status, injury_type, injury_detail, return_date
                        )
                    
                    news_items.append(news_item)
            
            logger.info(f"Fetched {len(news_items)} injury items from ESPN")
            return news_items
            
        except Exception as e:
            logger.error(f"Error fetching ESPN injury data: {e}")
            return []
    
    def _generate_injury_fantasy_note(self, player_name: str, status: str, injury_type: str, 
                                    injury_detail: str, return_date: str = None) -> str:
        """Generate a fantasy impact note for injury"""
        impact_note = f"{player_name} is currently {status.lower()}"
        
        if injury_type:
            impact_note += f" with a {injury_type}"
        if injury_detail:
            impact_note += f" ({injury_detail})"
        
        if 'day-to-day' in status.lower():
            impact_note += ". Monitor his status closely as he could return any day."
        elif 'out' in status.lower():
            impact_note += ". Consider benching him in fantasy lineups until further notice."
        elif 'season' in status.lower():
            impact_note += ". Season-ending injury - safe to drop in most fantasy leagues."
        
        if return_date:
            impact_note += f" Expected return: {return_date}."
        
        return impact_note
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_nba_news(self) -> List[NewsItem]:
        """Fetch NBA news from NBA.com"""
        try:
            logger.info("Fetching news from NBA.com...")
            url = "https://stats.nba.com/stats/v2/news"
            headers = {
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.nba.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = self.session.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            news_items = []
            
            for article in data.get('result', []):
                news_item = NewsItem(
                    title=article.get('title', ''),
                    content=article.get('summary', ''),
                    source='nba',
                    source_url=article.get('url'),
                    author=article.get('author'),
                    published_at=article.get('publishedDate', ''),
                )
                
                # Extract summary
                if news_item.content:
                    news_item.summary = news_item.content[:200] + '...' if len(news_item.content) > 200 else news_item.content
                
                news_items.append(news_item)
            
            logger.info(f"Fetched {len(news_items)} items from NBA.com")
            return news_items
            
        except Exception as e:
            logger.error(f"Error fetching NBA.com news: {e}")
            return []
    
    def extract_player_info(self, title: str, content: Optional[str] = None) -> Dict:
        """Extract player information from news text using AI"""
        try:
            prompt = f"""
            Extract NBA player information from this news headline and content. Return null if no specific player is mentioned.

            Headline: {title}
            Content: {content or ''}

            Look for player names and try to match them to NBA players. Also try to extract team information if mentioned.

            Return ONLY valid JSON with:
            - player_name: The NBA player name if found (null if none)
            - player_id: Player ID if determinable (null if none)
            - team: Team abbreviation if mentioned (null if none)
            - found: Boolean indicating if a specific player was found

            Do not include any text before or after the JSON. Only return the JSON object.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert NBA analyst. Extract player information from news text and return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=200
            )
            
            # Check if response content exists and is not empty
            response_content = response.choices[0].message.content
            if not response_content or response_content.strip() == "":
                logger.error(f"Empty response from OpenAI API for title: {title[:50]}...")
                return {"found": False, "player_name": None, "player_id": None, "team": None}
            
            # Log the raw response for debugging
            logger.debug(f"OpenAI response for '{title[:30]}...': {response_content[:200]}...")
            
            # Try to extract JSON from response if it's wrapped in other text
            response_content = response_content.strip()
            if response_content.startswith('```json'):
                response_content = response_content[7:]
            if response_content.endswith('```'):
                response_content = response_content[:-3]
            response_content = response_content.strip()
            
            result = json.loads(response_content)
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error extracting player info for '{title[:50]}...': {e}")
            logger.error(f"Response content: {response.choices[0].message.content}")
            return {"found": False, "player_name": None, "player_id": None, "team": None}
        except Exception as e:
            logger.error(f"Error extracting player info: {e}")
            return {"found": False, "player_name": None, "player_id": None, "team": None}
    
    def categorize_and_analyze_news(self, news_item: NewsItem) -> NewsItem:
        """Categorize and analyze news using AI"""
        try:
            prompt = f"""
            Analyze this NBA news item and categorize it for fantasy basketball impact.

            Title: {news_item.title}
            Content: {news_item.content or ''}
            Player: {news_item.player_name or 'Unknown'}

            Categorize this news as one of: injury, trade, suspension, performance, roster, other
            If it's an injury, determine severity: minor, moderate, severe, season_ending
            Assess fantasy impact: low, medium, high, critical
            If it's an injury, estimate games missed and expected return timeline.
            Generate a fantasy impact note explaining how this affects the player's fantasy value.

            Return ONLY valid JSON with:
            - category: one of injury, trade, suspension, performance, roster, other
            - severity: one of minor, moderate, severe, season_ending (for injuries)
            - impact_level: one of low, medium, high, critical
            - status: one of active, resolved, monitoring (for injuries)
            - expected_return_date: YYYY-MM-DD format or null
            - games_missed: number or null
            - tags: array of relevant tags
            - affected_stats: array of fantasy stats that might be affected
            - fantasy_impact_note: detailed analysis of fantasy impact

            Do not include any text before or after the JSON. Only return the JSON object.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert NBA fantasy analyst. Analyze news and return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=500
            )
            
            # Check if response content exists and is not empty
            response_content = response.choices[0].message.content
            if not response_content or response_content.strip() == "":
                logger.error(f"Empty response from OpenAI API for title: {news_item.title[:50]}...")
                return news_item
            
            # Log the raw response for debugging
            logger.debug(f"OpenAI response for '{news_item.title[:30]}...': {response_content[:200]}...")
            
            # Try to extract JSON from response if it's wrapped in other text
            response_content = response_content.strip()
            if response_content.startswith('```json'):
                response_content = response_content[7:]
            if response_content.endswith('```'):
                response_content = response_content[:-3]
            response_content = response_content.strip()
            
            result = json.loads(response_content)
            
            # Update news item with analysis
            news_item.category = result.get('category', 'other')
            news_item.severity = result.get('severity')
            news_item.impact_level = result.get('impact_level', 'low')
            news_item.status = result.get('status')
            news_item.expected_return_date = result.get('expected_return_date')
            news_item.games_missed = result.get('games_missed')
            news_item.tags = result.get('tags', [])
            news_item.affected_stats = result.get('affected_stats', [])
            news_item.fantasy_impact_note = result.get('fantasy_impact_note')
            
            return news_item
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error categorizing news for '{news_item.title[:50]}...': {e}")
            logger.error(f"Response content: {response.choices[0].message.content}")
            return news_item
        except Exception as e:
            logger.error(f"Error categorizing news: {e}")
            return news_item
    
    async def fetch_all_news(self) -> List[NewsItem]:
        """Fetch news from all sources"""
        logger.info("Starting to fetch NBA news from all sources...")
        
        # Fetch from multiple sources concurrently
        espn_news = self.fetch_espn_news()
        espn_injuries = self.fetch_espn_injuries()
        # nba_news = self.fetch_nba_news()
        
        all_news = espn_news + espn_injuries # + nba_news
        
        # Process each news item
        processed_news = []
        for news_item in all_news:
            try:
                # Skip AI processing for injury data since it's already well-structured
                if news_item.source == 'espn_injuries':
                    # Injury data is already processed, just add to results
                    processed_news.append(news_item)
                    continue
                
                # Extract player information for other news sources
                player_info = self.extract_player_info(news_item.title, news_item.content)
                if player_info.get('found'):
                    news_item.player_name = player_info.get('player_name')
                    news_item.player_id = player_info.get('player_id')
                    news_item.team = player_info.get('team')
                
                # Categorize and analyze
                processed_news.append(self.categorize_and_analyze_news(news_item))
                
            except Exception as e:
                logger.error(f"Error processing news item '{news_item.title}': {e}")
                processed_news.append(news_item)
        
        logger.info(f"Processed {len(processed_news)} news items")
        return processed_news

class DatabaseManager:
    """Manages database operations for NBA news"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
    
    def save_news_item(self, news_item: NewsItem) -> bool:
        """Save a news item to the database"""
        try:
            conn = psycopg2.connect(self.database_url)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # First check if the article already exists
            check_query = """
                SELECT id FROM nba_news 
                WHERE title = %s AND published_at = %s
            """
            
            cursor.execute(check_query, (news_item.title, news_item.published_at))
            existing_id = cursor.fetchone()
            
            if existing_id:
                logger.debug(f"Article already exists: {news_item.title[:50]}...")
                return False
            
            query = """
                INSERT INTO nba_news (
                    player_name, player_id, team, title, content, summary,
                    category, severity, impact_level, status, expected_return_date,
                    games_missed, source, source_url, author, published_at,
                    tags, affected_stats, fantasy_impact_note
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                RETURNING id
            """
            
            cursor.execute(query, (
                news_item.player_name,
                news_item.player_id,
                news_item.team,
                news_item.title,
                news_item.content,
                news_item.summary,
                news_item.category,
                news_item.severity,
                news_item.impact_level,
                news_item.status,
                news_item.expected_return_date,
                news_item.games_missed,
                news_item.source,
                news_item.source_url,
                news_item.author,
                news_item.published_at,
                news_item.tags,
                news_item.affected_stats,
                news_item.fantasy_impact_note
            ))
            
            result = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            
            return result is not None
            
        except Exception as e:
            logger.error(f"Error saving news item to database: {e}")
            return False
    
    def cleanup_old_news(self, days: int = 30):
        """Remove news older than specified days"""
        try:
            conn = psycopg2.connect(self.database_url)
            cursor = conn.cursor()
            
            query = """
                DELETE FROM nba_news 
                WHERE published_at < CURRENT_DATE - INTERVAL '%s days'
            """
            
            cursor.execute(query, (days,))
            deleted_count = cursor.rowcount
            
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.info(f"Cleaned up {deleted_count} old news items")
            
        except Exception as e:
            logger.error(f"Error cleaning up old news: {e}")

async def main():
    """Main function to fetch and save NBA news"""
    # Check environment variables
    database_url = os.getenv('DATABASE_URL')
    openai_api_key = os.getenv('OPENAI_API_KEY')
    
    if not database_url:
        logger.error("DATABASE_URL environment variable is required")
        sys.exit(1)
    
    if not openai_api_key:
        logger.error("OPENAI_API_KEY environment variable is required")
        sys.exit(1)
    
    logger.info("Starting NBA news fetch process...")
    
    try:
        # Initialize fetcher and database manager
        fetcher = NBANewsFetcher()
        db_manager = DatabaseManager(database_url)
        
        # Fetch all news
        news_items = await fetcher.fetch_all_news()
        
        # Save news items
        saved_count = 0
        for news_item in news_items:
            if db_manager.save_news_item(news_item):
                saved_count += 1
        
        logger.info(f"Successfully saved {saved_count} new news items")
        
        # Cleanup old news (keep last 30 days)
        db_manager.cleanup_old_news(30)
        
        logger.info("NBA news fetch process completed successfully")
        
    except Exception as e:
        logger.error(f"Error in main process: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
