import { UIMessage, useChat } from "@ai-sdk/react";
import { useChatContext } from "./chat-provider";
import { useEffect } from "react";
import { Spinner } from "../ui/spinner";
import { ChatStatus } from "ai";

export default function Messages() {
    const { chat, clearChat } = useChatContext();
    const { messages, status } = useChat({chat});

    const renderStatus = (status: ChatStatus) => {
        switch(status) {
            case 'error':
                return (
                    <>
                        <div className="italic">Error</div>
                        <p>An error has occured. Please try again.</p>
                    </>
                )
            case 'streaming': 
                return (
                    <div className="flex gap-2 align-items-center">
                        <Spinner /> <span>Processing... </span>
                    </div>
                )
        }
    }

    return (
        <div className="space-y-4">
            {messages.map(m => (
            <div key={m.id} className="whitespace-pre-wrap">
                <div>
                <div className="font-bold">{m.role}</div>
                {m.parts.map((part, index) => {
                    switch (part.type) {
                    case 'text':
                        return <p key={index}>{part.text}</p>;
                    }
                })}
                </div>
            </div>
            ))}
            {renderStatus(status)}
        </div>
    )
}