'use client';

import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';

import { Actions, Action } from '@/components/ai-elements/actions';
import { Fragment, useState } from 'react';
import { useChat } from "@ai-sdk-tools/store";
import { Response } from '@/components/ai-elements/response';
import { RefreshCcwIcon, CopyIcon, MoreHorizontal } from 'lucide-react';
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
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


  // Use the burn rate artifact with event listeners
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
      // Show different toasts based on stage changes
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

  // Track when we have data to trigger animation
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
		<div className="max-w-4xl mx-auto p-6 relative size-full border border-border rounded-lg">
			<div className="flex flex-col h-full">
				<Conversation className="h-full">
					<ConversationContent>
						{messages.map((message) => (
							<div key={message.id}>
								{message.parts.map((part, i) => {
									switch (part.type) {
										case 'text':
											return (
												<Fragment key={`${message.id}-${i}`}>
													<Message from={message.role}>
														<MessageContent>
															<Response>{part.text}</Response>
														</MessageContent>
													</Message>
													{message.role === 'assistant' &&
														i === messages.length - 1 && (
															<Actions className="mt-2">
																<Action onClick={() => {}} label="Retry">
																	<RefreshCcwIcon className="size-3" />
																</Action>
																<Action
																	onClick={() =>
																		navigator.clipboard.writeText(part.text)
																	}
																	label="Copy"
																>
																	<CopyIcon className="size-3" />
																</Action>
															</Actions>
														)}
												</Fragment>
											);
										case 'reasoning':
											return (
												<Reasoning
													key={`${message.id}-${i}`}
													className="w-full"
													isStreaming={
														status === 'streaming' &&
														i === message.parts.length - 1 &&
														message.id === messages.at(-1)?.id
													}
												>
													<ReasoningTrigger />
													<ReasoningContent>{part.text}</ReasoningContent>
												</Reasoning>
											);
										default:
											return null;
									}
								})}
							</div>
						))}
						{status === 'submitted' && <Loader />}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>

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

      {/* Right Panel - Analysis */}
      {hasArtifacts && (
        <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
          {/* Analysis Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Analysis
            </h2>
            <button
              type="button"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Analysis Content */}
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
