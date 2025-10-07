'use client';

import Messages from '@/components/chat/chat';
import ChatForm from '@/components/chat-input/form';
import { ChatScrollAnchor } from '@/components/scroll-anchor/scroll-anchor';
import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function Chat() {
  const { sendMessage, messages, status } = useChat();
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

  const handleSubmit = useCallback((input: string) => {
    sendMessage({ text: input });
    // Scroll to bottom immediately when user sends a message
    setTimeout(() => scrollToBottom(), 100);
  }, [sendMessage, scrollToBottom]);

  return (
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto">
      {/* Messages container with fixed height and scroll */}
      <div 
        ref={scrollAreaRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 pt-24 pb-32"
      >
        <Messages messages={messages} />
        <ChatScrollAnchor
          trackVisibility={true}
          isAtBottom={isAtBottom}
          scrollAreaRef={scrollAreaRef}
        />
      </div>
      
      {/* Fixed form at bottom */}
      <ChatForm onSubmit={handleSubmit} disabled={status === 'streaming'} />
    </div>
  );
}