'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from "@ai-sdk-tools/store";
import { DefaultChatTransport } from 'ai';
import { generateUUID } from '@databuddy/ai/lib/utils';

import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { Messages } from './messages';
import { trpc } from '@/lib/trpc';
import { ChatMessage } from '@databuddy/ai/lib/types';
import { notFound } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChatInput } from './chat-input';
import { ChatHeader } from './chat-header';
// import { Canvas } from './canvas';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const Chat = ({ id, websiteId, initialMessages, initialChatModel }: { id: string, websiteId: string, initialMessages: ChatMessage[], initialChatModel: string }) => {
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  const { current } = useArtifacts();
  const isCanvasVisible = !!current;

  // Fetch votes for the current chat
  const { data: votes = [] } = trpc.assistant.getVotes.useQuery(
    { chatId: id },
    { enabled: !!id }
  );

  const { messages, sendMessage, setMessages, regenerate, status } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    generateId: generateUUID,
    experimental_throttle: 100,
    transport: new DefaultChatTransport({
      api: `${API_BASE_URL}/v1/assistant`,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          credentials: 'include',
          body: {
            id,
            message: messages.at(-1),
            selectedChatModel: currentModelIdRef.current,
            websiteId,
            ...body,
          },
        };
      },
    })
  })

  if (!websiteId) {
    return notFound();
  }

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  return (
    <div className="flex size-full items-center justify-center divide-x divide-border gap-2">
      <div className={cn("relative size-full border border-border rounded-lg flex flex-col transition-all duration-300 ease-in-out", isCanvasVisible && "pr-[603px]",)}>
        <ChatHeader websiteId={websiteId} />

        <div className="relative flex flex-col flex-1 h-full p-6 overflow-y-auto">
          <Messages
            chatId={id}
            status={status}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            regenerate={regenerate}
            isReadonly={false}
            selectedModelId={currentModelId}
          />

          <ChatInput
            sendMessage={sendMessage}
            status={status}
            selectedModelId={currentModelId}
            onModelChange={setCurrentModelId}
            messages={messages}
            chatId={id}
            websiteId={websiteId}
          />
        </div>
      </div>

      {/* <Canvas websiteId={websiteId} /> */}
    </div>
  );
};

export default Chat;
