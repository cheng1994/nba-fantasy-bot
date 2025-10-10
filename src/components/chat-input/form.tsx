'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useChatContext } from '../chat/chat-provider';
import { useChat } from '@ai-sdk/react';
import { Button } from '../ui/button';
import { OctagonX } from 'lucide-react';

interface ChatFormProps {
  className?: string;
  disabled?: boolean;
  handleOnSubmit?: () => void
}

export default function ChatForm({ className, handleOnSubmit, disabled }: ChatFormProps) {
  const { chat } = useChatContext();
  const [input, setInput] = useState('');
  const { status, stop, sendMessage } = useChat({ chat });

  const handleSubmit = ((e: FormEvent<HTMLFormElement>, input: string) => {
    e.preventDefault();
    if (input.trim() === '') return;
    sendMessage({ text: input });
    setInput('');
  });

  useEffect(() => {
    console.log(status);
  }, [status])

  return (
    <form className="relative" onSubmit={(e) => handleSubmit(e, input)}>
      <input
        name="chat-input"
        className="w-full p-2 border border-input rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Say something..."
        disabled={status === 'streaming'}
        onChange={e => setInput(e.target.value)}
        value={input}
      />
      {(status === 'submitted' || status === 'streaming') && (
        <Button className="absolute right-0" variant="ghost" onClick={stop}><OctagonX size={16}/></Button>
      )}
    </form>
  );
}
