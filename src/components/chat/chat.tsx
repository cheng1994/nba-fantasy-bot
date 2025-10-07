import { UIMessage } from "@ai-sdk/react";

export default function Messages({messages}: {messages: UIMessage[]}) {
    
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
        </div>
    )
}