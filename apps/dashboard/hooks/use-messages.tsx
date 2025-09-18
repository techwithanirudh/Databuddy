import { useState, useEffect } from 'react';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@databuddy/ai/lib/types';

export function useMessages({
    chatId,
    status,
}: {
    chatId: string;
    status: UseChatHelpers<ChatMessage>['status'];
}) {
    const {
        containerRef,
        endRef,
        isAtBottom,
        scrollToBottom,
        onViewportEnter,
        onViewportLeave,
    } = useScrollToBottom();

    const [hasSentMessage, setHasSentMessage] = useState(false);

    useEffect(() => {
        if (status === 'submitted') {
            setHasSentMessage(true);
        }
    }, [status]);

    return {
        containerRef,
        endRef,
        isAtBottom,
        scrollToBottom,
        onViewportEnter,
        onViewportLeave,
        hasSentMessage,
    };
}