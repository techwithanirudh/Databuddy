'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from "@ai-sdk-tools/store";
import { DefaultChatTransport } from 'ai';    
import { generateUUID } from '@databuddy/ai/lib/utils';
import { MultimodalInput } from './multimodal-input';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';

import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { Messages } from './messages';
import { trpc } from '@/lib/trpc';
import { Artifacts } from './artifacts';
import { ChatMessage } from '@databuddy/ai/lib/types';
import { notFound } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const Chat = ({ id, websiteId, initialMessages, initialChatModel }: { id: string, websiteId: string, initialMessages: ChatMessage[], initialChatModel: string }) => {
  const [input, setInput] = useState('');
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);
  const { current } = useArtifacts();

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

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage({
      text: message.text || 'Sent with attachments',
      files: message.files,
    });
    setInput('');
  };


  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  return (
    <div className="flex size-full items-center justify-center divide-x divide-border gap-2">
      <div className="p-6 relative size-full border border-border rounded-lg flex flex-col h-full">
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

        <MultimodalInput
          handleSubmit={handleSubmit}
          sendMessage={sendMessage}
          status={status}
          input={input}
          setInput={setInput}
          selectedModelId={currentModelId}
          onModelChange={setCurrentModelId}
          messages={messages}
          chatId={id}
          websiteId={websiteId}
        />
      </div>

      {current && (
        <div className="relative size-full border border-border rounded-lg flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-xl font-semibold text-foreground">
              Data Visualization
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <Artifacts />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
