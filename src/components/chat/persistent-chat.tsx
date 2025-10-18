'use client';

import Messages from '@/components/chat/chat';
import { ChatScrollAnchor } from '@/components/scroll-anchor/scroll-anchor';
import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useChatContext } from './chat-provider';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ChatForm from '../chat-input/form';

interface PersistentChatProps {
  isOnChatPage: boolean;
  chatStarted?: boolean;
}

export default function PersistentChat({isOnChatPage}: PersistentChatProps) {
  const { chat, isChatOpen, closeChat, chatStarted, startChat } = useChatContext();
  const { messages, status } = useChat({chat});
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  

  const onScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
    setIsAtBottom(isAtBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!scrollAreaRef.current) return;
    
    const scrollAreaElement = scrollAreaRef.current;
    scrollAreaElement.scrollTop = scrollAreaElement.scrollHeight - scrollAreaElement.clientHeight;
    setIsAtBottom(true);
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // Scroll to bottom when streaming starts
  useEffect(() => {
    if (status === 'streaming' && isAtBottom) {
      scrollToBottom();
    }
  }, [status, isAtBottom, scrollToBottom]);

  const handleSubmit = useCallback(() => {
    // Scroll to bottom immediately when user sends a message
    setTimeout(() => scrollToBottom(), 100);
  }, [scrollToBottom]);

  if (!isChatOpen && !isOnChatPage) {
    return null;
  }

  return (
    <div className={cn(isOnChatPage ? "w-full max-w-4xl mx-auto h-screen flex flex-col" : "fixed right-0 top-0 h-screen w-full md:w-[600px] bg-background border-l border-border flex flex-col shadow-xl z-50")}>
      {/* Header */}
      {!isOnChatPage && (
        <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">NBA Fantasy Assistant</h2>
            <Button variant="ghost" size="icon" onClick={closeChat}>
            <X className="h-4 w-4" />
            </Button>
        </div>
      )}

      {/* Messages container with fixed height and scroll */}
      <div 
        ref={scrollAreaRef}
        onScroll={onScroll}
        className={cn("no-scrollbar flex-1 overflow-y-auto w-full px-4 pb-4", isOnChatPage && "pb-24",)}
      >
        <Messages />
        <ChatScrollAnchor
          trackVisibility={true}
          isAtBottom={isAtBottom}
          scrollAreaRef={scrollAreaRef}
        />
      </div>
      
      {/* Form at bottom */}
      <div className={isOnChatPage ? "p-4 border-t border-border fixed bottom-0 w-full max-w-4xl bg-background" : "p-4 border-t border-border"}>
        <ChatForm handleOnSubmit={handleSubmit}/>
        
      </div>
    </div>
  );
}

