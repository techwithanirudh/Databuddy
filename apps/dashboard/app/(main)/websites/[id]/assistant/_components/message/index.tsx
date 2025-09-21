'use client';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@databuddy/ai/lib/types';
import type { Vote } from '@databuddy/db';
// import { PreviewAttachment } from './preview-attachment';
import equal from 'fast-deep-equal';
import { motion } from 'framer-motion';
import { memo, useState } from 'react';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from '@/components/ai-elements/tool';
import { cn, sanitizeText } from '@/lib/utils';
import { MessageActions } from './message-actions';
import { MessageEditor } from './message-editor';
import { MessageReasoning } from './message-reasoning';

const PurePreviewMessage = ({
	chatId,
	message,
	vote,
	isLoading,
	isReadonly,
	regenerate,
	setMessages,
}: {
	chatId: string;
	message: ChatMessage;
	vote: Vote | undefined;
	isLoading: boolean;
	isReadonly: boolean;
	setMessages: UseChatHelpers<ChatMessage>['setMessages'];
	regenerate: UseChatHelpers<ChatMessage>['regenerate'];
}) => {
	const [mode, setMode] = useState<'view' | 'edit'>('view');

	// const attachmentsFromMessage = message.parts.filter(
	//     (part) => part.type === 'file',
	// );

	return (
		<Message from={message.role} key={message.id}>
			<div
				className={cn('flex flex-col', {
					'gap-2 md:gap-4': message.parts?.some(
						(p) => p.type === 'text' && p.text?.trim()
					),
					'w-full':
						(message.role === 'assistant' &&
							message.parts?.some(
								(p) => p.type === 'text' && p.text?.trim()
							)) ||
						mode === 'edit',
					'max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]':
						message.role === 'user' && mode !== 'edit',
				})}
			>
				{/* {attachmentsFromMessage.length > 0 && (
                        <div
                            data-testid={`message-attachments`}
                            className="flex flex-row justify-end gap-2"
                        >
                            {attachmentsFromMessage.map((attachment) => (
                                <PreviewAttachment
                                    key={attachment.url}
                                    attachment={{
                                        name: attachment.filename ?? 'file',
                                        contentType: attachment.mediaType,
                                        url: attachment.url,
                                    }}
                                />
                            ))}
                        </div>
                    )} */}

				{message.parts?.map((part, index) => {
					const { type } = part;
					const key = `message-${message.id}-part-${index}`;

					if (type === 'reasoning' && part.text?.trim().length > 0) {
						return (
							<MessageReasoning
								isLoading={isLoading}
								key={key}
								reasoning={part.text}
							/>
						);
					}

					if (type === 'tool-executeSQLQuery') {
						const { toolCallId, state } = part;

						return (
							<Tool defaultOpen={true} key={toolCallId}>
								<ToolHeader state={state} type="tool-executeSQLQuery" />
								<ToolContent>
									{state === 'input-available' && (
										<ToolInput input={part.input} />
									)}
									{state === 'output-available' && (
										<ToolOutput errorText={undefined} output={part.output} />
									)}
								</ToolContent>
							</Tool>
						);
					}

					if (type === 'text') {
						if (mode === 'view') {
							return (
								<MessageContent key={key} variant={'flat'}>
									<Response>{sanitizeText(part.text)}</Response>
								</MessageContent>
							);
						}

						if (mode === 'edit') {
							return (
								<div
									className="flex w-full flex-row items-start gap-3"
									key={key}
								>
									<div className="size-8" />
									<div className="min-w-0 flex-1">
										<MessageEditor
											key={message.id}
											message={message}
											regenerate={regenerate}
											setMessages={setMessages}
											setMode={setMode}
										/>
									</div>
								</div>
							);
						}
					}
				})}

				{!isReadonly && (
					<MessageActions
						chatId={chatId}
						isLoading={isLoading}
						key={`action-${message.id}`}
						message={message}
						mode={mode}
						setMode={setMode}
						vote={vote}
					/>
				)}
			</div>
		</Message>
	);
};

export const PreviewMessage = memo(
	PurePreviewMessage,
	(prevProps, nextProps) => {
		if (prevProps.isLoading !== nextProps.isLoading) {
			return false;
		}
		if (prevProps.message.id !== nextProps.message.id) {
			return false;
		}
		if (!equal(prevProps.message.parts, nextProps.message.parts)) {
			return false;
		}
		if (!equal(prevProps.vote, nextProps.vote)) {
			return false;
		}

		return false;
	}
);

export const ThinkingMessage = () => {
	const role = 'assistant';

	return (
		<motion.div
			animate={{ opacity: 1 }}
			className="group w-full"
			data-role={role}
			initial={{ opacity: 0 }}
		>
			<div className="flex items-start justify-start gap-3">
				<div className="flex w-full flex-col gap-2 text-sm md:gap-4">
					<LoadingText>Thinking...</LoadingText>
				</div>
			</div>
		</motion.div>
	);
};

const LoadingText = ({ children }: { children: React.ReactNode }) => {
	return (
		<motion.div
			animate={{ backgroundPosition: ['100% 50%', '-100% 50%'] }}
			className="flex items-center text-transparent"
			style={{
				background:
					'linear-gradient(90deg, hsl(var(--muted-foreground)) 0%, hsl(var(--muted-foreground)) 35%, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground)) 65%, hsl(var(--muted-foreground)) 100%)',
				backgroundSize: '200% 100%',
				WebkitBackgroundClip: 'text',
				backgroundClip: 'text',
			}}
			transition={{
				duration: 1.5,
				repeat: Number.POSITIVE_INFINITY,
				ease: 'linear',
			}}
		>
			{children}
		</motion.div>
	);
};
