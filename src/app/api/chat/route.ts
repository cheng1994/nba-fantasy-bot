import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a helpful assistant that can answer questions and help with tasks, regarding NBA fantasy basketball.
    Only response to questions using information from tool calls. If no relevant information is found, say "I don't know"`,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}