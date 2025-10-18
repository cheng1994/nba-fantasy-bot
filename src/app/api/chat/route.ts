import { queryDatabaseTool } from '@/app/actions';
import { queryNBANewsTool } from '@/lib/actions/nba-news';
import { getWishlistTool, getWishlistPlayerIdsTool, checkPlayerWishlistStatusTool } from '@/lib/actions/wishlist-tool';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from 'ai';
import { stackServerApp } from '@/stack/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Load the AI prompt template at module initialization
const AI_PROMPT_TEMPLATE = readFileSync(
  join(process.cwd(), 'src/app/api/chat/ai-prompt.md'),
  'utf-8'
);

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    
    // Get the authenticated user
    const user = await stackServerApp.getUser();
    
    // If no user is authenticated, return an error
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = user.id;

    // Inject the userId into the system prompt template
    const systemPrompt = AI_PROMPT_TEMPLATE.replace(/\$\{userId\}/g, userId);

    const result = streamText({
      model: anthropic('claude-haiku-4-5-20251001'),
      maxOutputTokens: 5000,
      maxRetries: 5,
      stopWhen: stepCountIs(20),
      onError({ error }) {
        console.error('Stream error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'Error',
          error: error,
        });
      },
      tools: {
        queryDatabase: queryDatabaseTool,
        queryNBANews: queryNBANewsTool,
        getWishlist: getWishlistTool,
        getWishlistPlayerIds: getWishlistPlayerIdsTool,
        checkPlayerWishlistStatus: checkPlayerWishlistStatusTool
      },
      messages: convertToModelMessages(messages),
      headers: {
        'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
      },
      system: systemPrompt,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Fatal error in chat route:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while processing your request. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}