"use client";

import { useChatContext } from "@/components/chat/chat-provider"
import { cn } from "@/lib/utils";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const { isChatOpen } = useChatContext();
    return (
        <>
            <section className={cn(
                "w-full h-full self-start transition-all duration-300",
                isChatOpen && "md:mr-[600px] md:max-w-[calc(100vw-600px)]"
            )}>
                {children}
            </section>
        </>
    )
}