import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider/theme-provider'
import { ChatProvider } from '@/components/chat/chat-provider'
import Header from '@/components/header/header'
import PersistentChat from '@/components/chat/persistent-chat';
import { Toaster } from "sonner";

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode,
}>) {    
    const user = await stackClientApp.getUser({ or: "return-null"});
    return (
        <html className="no-scrollbar" lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased no-scrollbar`}><StackProvider app={stackClientApp}><StackTheme>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                    storageKey="nba-fantasy-draft-assistant-theme"
                >
                    <ChatProvider>
                        <Header user={user?.displayName} />
                        <main className="flex flex-col h-screen w-full mx-auto items-center pt-18">
                            {children}
                        </main>
                        <PersistentChat isOnChatPage={false} />
                        <Toaster richColors position="top-center" />
                    </ChatProvider>
                </ThemeProvider>
            </StackTheme></StackProvider></body>
        </html>
    )
}
