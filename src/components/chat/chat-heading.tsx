'use client';

import { useChatContext } from '@/components/chat/chat-provider';
import { MessageSquare } from 'lucide-react';
import { useChat } from '@ai-sdk/react';

export default function ChatHeading() {

  const { chat } = useChatContext();
  const { messages } = useChat({chat})

  return (
    <>
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full w-full p-8">
                <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground" />
                <h1 className="text-3xl font-bold mb-2">NBA Fantasy Assistant</h1>
                <p className="text-muted-foreground text-center max-w-md">
                    Your AI-powered assistant for NBA fantasy basketball. 
                    Use the chat panel to ask questions about players, stats, and strategy.
                </p>
            </div>
        )}
    </>
  );
}