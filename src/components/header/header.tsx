'use client';

import Link from "next/link";
import { Button } from "../ui/button";
import { ModeToggle } from "../mode-toggle/mode-toggle";
import { useChatContext } from "../chat/chat-provider";
import { MessageSquare, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

export default function Header({ user }: { user: string | null | undefined}) {
    const { toggleChat } = useChatContext();

    return (
        <header className="fixed top-0 left-0 right-0 flex w-full p-4 justify-between items-center dark:border-b-2 dark:border-border z-40 bg-background">
            <h1 className="text-2xl font-bold"><Link className="flex items-center" href="/"><img src="deep-ball-logo.png" alt="Deep Ball" className="h-8 w-8 mr-2" /> Deep Ball</Link></h1>
            <div className="flex gap-2 ml-8">
                <Button variant="ghost" asChild>
                    <Link href="/chat">Chat</Link>
                </Button>
                <Button variant="ghost" asChild>
                    <Link href="/players">Players</Link>
                </Button>
                <Button variant="ghost" asChild>
                    <Link href="/team">Team</Link>
                </Button>
            </div>
            <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="icon" onClick={toggleChat}>
                    <MessageSquare className="h-5 w-5" />
                </Button>
                <ModeToggle />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <User className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {user && 
                            <>
                                <DropdownMenuItem asChild>
                                    <Link href="/profile">Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/handler/sign-out">Sign Out</Link>
                                </DropdownMenuItem>
                            </>
                        }
                        {!user && <DropdownMenuItem asChild>
                            <Link href="/handler/sign-in">Sign In</Link>
                        </DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}