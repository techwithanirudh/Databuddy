'use client';
import { motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@databuddy/db';
import { Response } from '@/components/ai-elements/response';
import { MessageContent } from '@/components/ai-elements/message';
import { MessageActions } from './message-actions';
// import { PreviewAttachment } from './preview-attachment';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { MessageReasoning } from './message-reasoning';
import type { ChatMessage } from '@databuddy/ai/lib/types';
import { Message } from '@/components/ai-elements/message';
import {
    Tool,
    ToolContent,
    ToolHeader,
    ToolOutput,
    ToolInput,
} from '@/components/ai-elements/tool';

const PurePreviewMessage = ({
    chatId,
    message,
    vote,
    isLoading,
    isReadonly,
}: {
    chatId: string;
    message: ChatMessage;
    vote: Vote | undefined;
    isLoading: boolean;
    isReadonly: boolean;
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
                        (p) => p.type === 'text' && p.text?.trim(),
                    ),
                    'w-full':
                        (message.role === 'assistant' &&
                            message.parts?.some(
                                (p) => p.type === 'text' && p.text?.trim(),
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
                                key={key}
                                isLoading={isLoading}
                                reasoning={part.text}
                            />
                        );
                    }


                    if (type === 'tool-executeSQLQuery') {
                        const { toolCallId, state } = part;

                        return (
                            <Tool key={toolCallId} defaultOpen={true}>
                                <ToolHeader type="tool-executeSQLQuery" state={state} />
                                <ToolContent>
                                    {state === 'input-available' && (
                                        <ToolInput input={part.input} />
                                    )}
                                    {state === 'output-available' && (
                                        <ToolOutput
                                            output={part.output}
                                            errorText={undefined}
                                        />
                                    )}
                                </ToolContent>
                            </Tool>
                        );
                    }

                    if (type === 'text') {
                        if (mode === 'view') {
                            return (
                                <MessageContent
                                    variant={'flat'}
                                    key={key}
                                >
                                    <Response>{sanitizeText(part.text)}</Response>
                                </MessageContent>
                            );
                        }

                        if (mode === 'edit') {
                            return (
                                <div
                                    key={key}
                                    className="flex w-full flex-row items-start gap-3"
                                >
                                    <div className="size-8" />
                                    <div className="min-w-0 flex-1">
                                        {/* <MessageEditor
                                                key={message.id}
                                                message={message}
                                                setMode={setMode}
                                                setMessages={setMessages}
                                                regenerate={regenerate}
                                            /> */}
                                        Not implemented
                                    </div>
                                </div>
                            );
                        }
                    }
                })}

                {!isReadonly && (
                    <MessageActions
                        key={`action-${message.id}`}
                        chatId={chatId}
                        message={message}
                        vote={vote}
                        isLoading={isLoading}
                        mode={mode}
                        setMode={setMode}
                    />
                )}
            </div>
        </Message>
    );
};

export const PreviewMessage = memo(
    PurePreviewMessage,
    (prevProps, nextProps) => {
        if (prevProps.isLoading !== nextProps.isLoading) return false;
        if (prevProps.message.id !== nextProps.message.id) return false;
        if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
        if (!equal(prevProps.vote, nextProps.vote)) return false;

        return false;
    },
);

export const ThinkingMessage = () => {
    const role = 'assistant';

    return (
        <motion.div
            className="group w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-role={role}
        >
            <div className="flex items-start justify-start gap-3">
                <div className="flex w-full flex-col gap-2 md:gap-4 text-sm">
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
            transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
            }}
            style={{
                background:
                    'linear-gradient(90deg, hsl(var(--muted-foreground)) 0%, hsl(var(--muted-foreground)) 35%, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground)) 65%, hsl(var(--muted-foreground)) 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
            }}
            className="flex items-center text-transparent"
        >
            {children}
        </motion.div>
    );
};