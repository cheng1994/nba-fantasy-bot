
"use client";

import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider/theme-provider'
import { ChatProvider } from '@/components/chat/chat-provider'
import Header from '@/components/header/header'
import PersistentChat from '@/components/chat/persistent-chat';
import {
    HydrationBoundary,
    QueryClient,
    QueryClientProvider,
  } from '@tanstack/react-query'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

const queryClient = new QueryClient()

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html className="no-scrollbar" lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased no-scrollbar`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                    storageKey="nba-fantasy-draft-assistant-theme"
                >
                    <ChatProvider>
                        <Header />
                        <main className="flex flex-col h-screen w-full mx-auto items-center pt-18">
                            {children}
                        </main>
                        <PersistentChat isOnChatPage={false} />
                    </ChatProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
