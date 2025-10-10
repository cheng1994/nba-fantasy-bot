'use client';

import Link from "next/link";
import { Button } from "../ui/button";
import { ModeToggle } from "../mode-toggle/mode-toggle";
import { useChatContext } from "../chat/chat-provider";
import { MessageSquare } from "lucide-react";

export default function Header() {
    const { toggleChat } = useChatContext();
    
    return (
        <header className="fixed top-0 left-0 right-0 flex w-full p-4 justify-between items-center dark:border-b-2 dark:border-border z-40 bg-background">
            <h1 className="text-2xl font-bold"><Link href="/">NBA Fantasy Draft Assistant</Link></h1>
            <div className="flex gap-2 ml-8">
                <Button variant="ghost" asChild>
                    <Link href="/chat">Chat</Link>
                </Button>
                <Button variant="ghost" asChild>
                    <Link href="/players">Players</Link>
                </Button>
            </div>
            <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="icon" onClick={toggleChat}>
                    <MessageSquare className="h-5 w-5" />
                </Button>
                <ModeToggle />
            </div>
        </header>
    )
}