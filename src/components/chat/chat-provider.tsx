'use client';

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Chat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';

interface ChatContextType {
  chat: Chat<UIMessage>;
  clearChat: () => void;
  isChatOpen: boolean;
  chatStarted: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  startChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function createChat() {
  return new Chat<UIMessage>({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chat, setChat] = useState(() => createChat());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

  const clearChat = () => {
    setChat(createChat());
  };
  const toggleChat = () => setIsChatOpen((prev) => !prev);
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
  const startChat = () => setChatStarted(true);

  return (
    <ChatContext.Provider value={{ chat, clearChat, isChatOpen, toggleChat, openChat, closeChat, chatStarted, startChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

