
import ChatHeading from '@/components/chat/chat-heading';
import PersistentChat from '@/components/chat/persistent-chat';
import { stackServerApp } from '@/stack/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat',
  description: 'Chat with your AI-powered NBA fantasy basketball assistant',
}

export default async function Chat() {
  const user = await stackServerApp.getUser({ or: "redirect" });
  const permission = await user.getPermission("chat");

  console.log(permission);
  return (
    <>
        <div className="flex flex-col items-center justify-center h-full w-full p-8">
            <ChatHeading />
        </div>
        <PersistentChat isOnChatPage={true} />
    </>
  );
}