'use client';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@databuddy/ai/types';
import type { Vote } from '@databuddy/db';
// import { PreviewAttachment } from './preview-attachment';
import equal from 'fast-deep-equal';
import { Fragment, memo, useState } from 'react';
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
	status,
	vote,
	isLoading,
	isReadonly,
	regenerate,
	setMessages,
}: {
	chatId: string;
	status: UseChatHelpers<ChatMessage>['status'];
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

					if (type.startsWith("tool-")) {
						return (
							<MessageContent>
								<Response>
									{(part as any)?.output?.text}
								</Response>
							</MessageContent>
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

					return null;
				})}

				{!isReadonly && status !== 'streaming' && (
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
