import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@databuddy/ai/types';
import type { Vote } from '@databuddy/db';
import equal from 'fast-deep-equal';
import { memo } from 'react';
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { ChatGreeting } from './chat-greeting';
import { PreviewMessage } from './message';
import { ThinkingMessage } from './message/thinking-message';

interface MessagesProps {
	chatId: string;
	status: UseChatHelpers<ChatMessage>['status'];
	votes: Vote[] | undefined;
	messages: ChatMessage[];
	setMessages: UseChatHelpers<ChatMessage>['setMessages'];
	regenerate: UseChatHelpers<ChatMessage>['regenerate'];
	isReadonly: boolean;
}

function PureMessages({
	chatId,
	status,
	votes,
	messages,
	setMessages,
	regenerate,
	isReadonly,
}: MessagesProps) {
	return (
		<div className="flex flex-1 overflow-y-auto">
			<Conversation className="mx-auto flex min-w-0 flex-col gap-4 md:gap-6">
				<ConversationContent className="flex h-full flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
					{messages.length === 0 && <ChatGreeting />}

					{messages.map((message, index) => (
						<PreviewMessage
							chatId={chatId}
							isLoading={
								status === 'streaming' && messages.length - 1 === index
							}
							isReadonly={isReadonly}
							key={message.id}
							message={message}
							regenerate={regenerate}
							setMessages={setMessages}
							vote={
								votes
									? votes.find((vote) => vote.messageId === message.id)
									: undefined
							}
						/>
					))}

					{status === 'submitted' &&
						messages.length > 0 &&
						messages.at(-1)?.role === 'user' && <ThinkingMessage />}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>
		</div>
	);
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
	if (prevProps.status !== nextProps.status) {
		return false;
	}
	if (prevProps.messages.length !== nextProps.messages.length) {
		return false;
	}
	if (!equal(prevProps.messages, nextProps.messages)) {
		return false;
	}
	if (!equal(prevProps.votes, nextProps.votes)) {
		return false;
	}

	return false;
});
