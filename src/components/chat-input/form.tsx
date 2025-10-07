'use client';

import { useState } from 'react';

interface ChatFormProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
}

export default function ChatForm({ onSubmit, disabled }: ChatFormProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <form
      className="fixed w-full bottom-0 pb-8 max-w-4xl bg-black"
      onSubmit={handleSubmit}
    >
      <input
        className="w-full p-2 border border-gray-300 rounded shadow-xl"
        value={input}
        placeholder="Say something..."
        onChange={(e) => setInput(e.currentTarget.value)}
        disabled={disabled}
      />
    </form>
  );
}
