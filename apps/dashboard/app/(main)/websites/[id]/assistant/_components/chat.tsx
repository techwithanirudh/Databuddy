'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';

import { useState } from 'react';
import { useChat } from "@ai-sdk-tools/store";
import { Loader } from '@/components/ai-elements/loader';
import { DefaultChatTransport } from 'ai';
import { useAtom } from 'jotai';
import { websiteIdAtom } from '@/stores/jotai/assistantAtoms';
import { generateUUID } from '@databuddy/ai/lib/utils';
import { MultimodalInput } from './prompt-input';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { BurnRateAnalysisPanel } from './artifacts/burn-rate/analysis-panel';
import { BurnRateLoading } from './artifacts/burn-rate/loading';

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { useEffect } from "react";
import { toast } from "sonner";
import { BurnRateArtifact } from "@databuddy/ai/artifacts";
import { ChatMessage } from './chat-message';
import { LoadingMessage } from './loading-message';
import { Examples } from './examples';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const models = [
  {
    name: 'Chat',
    value: 'chat-model',
  },
  {
    name: 'Agent',
    value: 'agent-model',
  },
  {
    name: 'Agent Max',
    value: 'agent-max-model',
  },
];

const Chat = ({ id }: { id: string }) => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [websiteId] = useAtom(websiteIdAtom);
  // const [websiteData] = useAtom(websiteDataAtom);
  const [hasArtifacts, setHasArtifacts] = useState(false);

  const { messages, sendMessage, status } = useChat({
    id,
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
            selectedChatModel: model,
            websiteId,
            ...body,
          },
        };
      },
    }),
  });

  const burnRateData = useArtifact(BurnRateArtifact, {
    onStatusChange: (newStatus, oldStatus) => {
      if (newStatus === "loading" && oldStatus === "idle") {
        toast.loading("Starting burn rate analysis...", {
          id: "burn-rate-analysis",
        });
      } else if (newStatus === "complete" && oldStatus === "streaming") {
        const alerts = burnRateData?.data?.summary?.alerts?.length || 0;
        const recommendations =
          burnRateData?.data?.summary?.recommendations?.length || 0;
        toast.success(
          `Analysis complete! Found ${alerts} alerts and ${recommendations} recommendations.`,
          { id: "burn-rate-analysis" },
        );
      }
    },
    onUpdate: (newData, oldData) => {
      if (newData.stage === "processing" && oldData?.stage === "loading") {
        toast.loading("Processing financial data...", {
          id: "burn-rate-analysis",
        });
      } else if (
        newData.stage === "analyzing" &&
        oldData?.stage === "processing"
      ) {
        toast.loading("Analyzing trends and generating insights...", {
          id: "burn-rate-analysis",
        });
      }
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error}`, {
        id: "burn-rate-analysis",
      });
    },
  });

  useEffect(() => {
    if (burnRateData?.data && !hasArtifacts) {
      setHasArtifacts(true);
    }
  }, [burnRateData?.data, hasArtifacts]);


  const hasAnalysisData =
    burnRateData?.data && burnRateData.data.stage === "complete";

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

  return (
    <div className="flex size-full items-center justify-center divide-x divide-border gap-2">
      <div className="p-6 relative size-full border border-border rounded-lg flex flex-col h-full">
        {messages.length === 0 && <Examples sendMessage={sendMessage} isLoading={status === 'submitted'} isRateLimited={false} />}
        {messages.length > 0 && ( <Conversation className="h-full">
          <ConversationContent>
            {messages.map((m, idx) => (
              <ChatMessage
                key={m.id}
                message={m as any}
                isLastMessage={idx === messages.length - 1}
                isStreaming={status === 'streaming'}
              />
            ))}
            {status === 'submitted' && <LoadingMessage />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}

        <MultimodalInput
          handleSubmit={handleSubmit}
          models={models}
          status={status}
          input={input}
          setInput={setInput}
          model={model}
          setModel={setModel}
        />
      </div>

      {hasArtifacts && (
        <div className="relative size-full border border-border rounded-lg flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-xl font-semibold text-foreground">
              Data Visualization
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {hasAnalysisData ? (
              <BurnRateAnalysisPanel />
            ) : (
              <BurnRateLoading />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
