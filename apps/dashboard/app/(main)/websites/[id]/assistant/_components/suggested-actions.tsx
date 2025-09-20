'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';
import { SuggestedAction, Suggestion } from '@/components/ai-elements/suggestion';
import { ChartBarIcon, HashIcon, TrendUpIcon } from '@phosphor-icons/react'; 
import type { UseChatHelpers } from '@ai-sdk/react';
import { ChatMessage } from '@databuddy/ai/lib/types';

interface SuggestedActionsProps {
    chatId: string;
    sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
    websiteId: string;
}

function PureSuggestedActions({
    chatId,
    websiteId,
    sendMessage,
}: SuggestedActionsProps) {
    const suggestedActions: SuggestedAction[] = [
        {
            text: 'Show me page views over the last 7 days',
            icon: TrendUpIcon,
            type: 'chart',
        },
        { text: 'How many visitors yesterday?', icon: HashIcon, type: 'metric' },
        {
            text: 'Top traffic sources breakdown',
            icon: ChartBarIcon,
            type: 'chart',
        },
        { text: "What's my bounce rate?", icon: HashIcon, type: 'metric' },
    ];


    return (
        <div
            className="grid w-full gap-2 sm:grid-cols-2"
        >
            {suggestedActions.map((suggestedAction, index) => (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.05 * index }}
                    key={suggestedAction.text}
                >
                    <Suggestion
                        suggestion={suggestedAction}
                        onClick={(suggestion: SuggestedAction) => {
                            window.history.replaceState({}, '', `/websites/${websiteId}/assistant/${chatId}`);
                            sendMessage({
                                role: 'user',
                                parts: [{ type: 'text', text: suggestion.text }],
                            });
                        }}
                        className="h-auto w-full whitespace-normal p-3 text-left"
                    >
                        <suggestedAction.icon className="mr-3 h-4 w-4 flex-shrink-0 text-primary/70" />
                        <div className="flex-1">
                            <div className="font-medium">{suggestedAction.text}</div>
                            <div className="text-muted-foreground text-xs capitalize">
                                {suggestedAction.type} response
                            </div>
                        </div>
                    </Suggestion>
                </motion.div>
            ))}
        </div>
    );
}

export const SuggestedActions = memo(
    PureSuggestedActions,
    (prevProps, nextProps) => {
        if (prevProps.chatId !== nextProps.chatId) return false;

        return true;
    },
);