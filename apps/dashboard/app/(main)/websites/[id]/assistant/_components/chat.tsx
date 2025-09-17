'use client';

import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';

import { Actions, Action } from '@/components/ai-elements/actions';
import { Fragment, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { GlobeIcon, RefreshCcwIcon, CopyIcon } from 'lucide-react';
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
		</div>
	);
};

export default Chat;
