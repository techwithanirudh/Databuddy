'use client';

import { Fragment } from 'react';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { Actions, Action } from '@/components/ai-elements/actions';
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { RefreshCcwIcon, CopyIcon } from 'lucide-react';
import type { UIMessage } from '@databuddy/ai';

interface ChatMessageProps {
    message: UIMessage;
    isLastMessage: boolean;
    isStreaming: boolean;
}

export const ChatMessage = ({ message, isLastMessage, isStreaming }: ChatMessageProps) => {
    return (
        <div>
            {message.parts.map((part, index) => {
                switch (part.type) {
                    case 'text':
                        return (
                            <Fragment key={`${message.id}-${index}`}>
                                <Message from={message.role}>
                                    <MessageContent>
                                        <Response>{part.text}</Response>
                                    </MessageContent>
                                </Message>
                                {message.role === 'assistant' && isLastMessage && index === message.parts.length - 1 && (
                                    <Actions className="mt-2">
                                        <Action onClick={() => { }} label="Retry">
                                            <RefreshCcwIcon className="size-3" />
                                        </Action>
                                        <Action
                                            onClick={() => navigator.clipboard.writeText(part.text)}
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
                                key={`${message.id}-${index}`}
                                className="w-full"
                                isStreaming={isStreaming && isLastMessage && index === message.parts.length - 1}
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
    );
};


