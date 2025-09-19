import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from './greeting';
import { memo } from 'react';
import type { Vote } from '@databuddy/db';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@databuddy/ai/lib/types';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';

interface MessagesProps {
    chatId: string;
    status: UseChatHelpers<ChatMessage>['status'];
    votes: Array<Vote> | undefined;
    messages: ChatMessage[];
    setMessages: UseChatHelpers<ChatMessage>['setMessages'];
    regenerate: UseChatHelpers<ChatMessage>['regenerate'];
    isReadonly: boolean;
    selectedModelId: string;
}

function PureMessages({
    chatId,
    status,
    votes,
    messages,
    setMessages,
    regenerate,
    isReadonly,
    selectedModelId,
}: MessagesProps) {
    return (
        <div className="flex flex-1 overflow-y-auto">
            <Conversation className="mx-auto flex min-w-0 flex-col gap-4 md:gap-6">
                <ConversationContent className="flex flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
                    {messages.length === 0 && <Greeting />}

                    {messages.map((message, index) => (
                        <PreviewMessage
                            key={message.id}
                            chatId={chatId}
                            message={message}
                            isLoading={
                                status === 'streaming' && messages.length - 1 === index
                            }
                            vote={
                                votes
                                    ? votes.find((vote) => vote.messageId === message.id)
                                    : undefined
                            }
                            setMessages={setMessages}
                            regenerate={regenerate}
                            isReadonly={isReadonly}
                        />
                    ))}

                    {status === 'submitted' &&
                        messages.length > 0 &&
                        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>
        </div>
    );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    if (!equal(prevProps.messages, nextProps.messages)) return false;
    if (!equal(prevProps.votes, nextProps.votes)) return false;

    return false;
});