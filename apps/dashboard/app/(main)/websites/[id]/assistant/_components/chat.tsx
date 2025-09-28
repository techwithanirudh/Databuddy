'use client';

import { useArtifacts } from '@ai-sdk-tools/artifacts/client';
import { useChat } from '@ai-sdk-tools/store';
import type { ChatMessage } from '@databuddy/ai/types';
import { generateUUID } from '@databuddy/ai/lib/utils';
import { DefaultChatTransport } from 'ai';
import { notFound } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { Canvas } from './canvas';
import { ChatHeader } from './chat-header';
import { ChatInput } from './chat-input';
import { Messages } from './messages';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const Chat = ({
	id,
	websiteId,
	initialMessages,
	initialChatModel,
}: {
	id: string;
	websiteId: string;
	initialMessages: ChatMessage[];
	initialChatModel: string;
}) => {
	const [currentModelId, setCurrentModelId] = useState(initialChatModel);
	const currentModelIdRef = useRef(currentModelId);

	const { current } = useArtifacts();
	const _isCanvasVisible = !!current;

	// Fetch votes for the current chat
	const { data: votes = [] } = trpc.assistant.getVotes.useQuery(
		{ chatId: id },
		{ enabled: !!id }
	);

	const { messages, sendMessage, setMessages, regenerate, status } =
		useChat<ChatMessage>({
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
			}),
		});

	useEffect(() => {
		currentModelIdRef.current = currentModelId;
	}, [currentModelId]);

	if (!websiteId) {
		return notFound();
	}

	return (
		<div className="flex size-full items-center justify-center gap-2 divide-x divide-border">
			<div
				className={cn(
					'relative flex size-full flex-col rounded-2xl border border-border transition-all duration-300 ease-in-out'
				)}
			>
				<ChatHeader websiteId={websiteId} />

				<div className="relative flex h-full flex-1 flex-col overflow-y-auto px-6 pb-6">
					<Messages
						chatId={id}
						isReadonly={false}
						messages={messages}
						regenerate={regenerate}
						setMessages={setMessages}
						status={status}
						votes={votes}
					/>

					<ChatInput
						chatId={id}
						messages={messages}
						onModelChange={setCurrentModelId}
						selectedModelId={currentModelId}
						sendMessage={sendMessage}
						status={status}
						websiteId={websiteId}
					/>
				</div>
			</div>

			<Canvas websiteId={websiteId} />
		</div>
	);
};

export default Chat;
