import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@databuddy/db';

import { CopyIcon, ThumbsDownIcon, ThumbsUpIcon, PencilIcon, Copy, Check } from 'lucide-react';
import { Actions, Action } from '@/components/ai-elements/actions';
import { memo, useState } from 'react';
import equal from 'fast-deep-equal';
import { toast } from 'sonner';
import type { ChatMessage } from '@databuddy/ai/lib/types';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

export function PureMessageActions({
    chatId,
    message,
    vote,
    isLoading,
    mode,
    setMode,
}: {
    chatId: string;
    message: ChatMessage;
    vote: Vote | undefined;
    isLoading: boolean;
    mode: 'view' | 'edit';
    setMode?: (mode: 'view' | 'edit') => void;
}) {
    const [_, copyToClipboard] = useCopyToClipboard();
    const [copied, setCopied] = useState(false);
    const utils = trpc.useUtils();

    const voteMutation = trpc.assistant.voteMessage.useMutation({
        onSuccess: () => {
            // Invalidate and refetch votes for this chat
            utils.assistant.getVotes.invalidate({ chatId });
        },
    });

    if (isLoading) return null;

    const textFromParts = message.parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('\n')
        .trim();

    const handleCopy = async () => {
        if (!textFromParts) {
            toast.error("There's no text to copy!");
            return;
        }

        await copyToClipboard(textFromParts);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    // User messages get edit (on hover) and copy actions
    if (message.role === 'user') {
        return (
            <Actions className="-mr-0.5 justify-end">
                <div
                    className={cn(
                        'opacity-100 md:opacity-0 transition-opacity group-hover/message:opacity-100 gap-1',
                        {
                            'md:opacity-100': mode === 'edit',
                        },
                    )}
                >
                    {setMode && (
                        <Action tooltip="Edit" onClick={() => setMode('edit')}>
                            <PencilIcon />
                        </Action>
                    )}
                    <Action tooltip="Copy" onClick={handleCopy}>
                        <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
                        <Copy
                            className={`size-4 transition-all duration-300 ${copied ? 'scale-0' : 'scale-100'
                                }`}
                        />
                        <Check
                            className={`absolute inset-0 m-auto size-4 transition-all duration-300 ${copied ? 'scale-100' : 'scale-0'
                                }`}
                        />
                    </Action>
                </div>
            </Actions>
        );
    }

    return (
        <Actions className="-ml-0.5">
            <Action tooltip="Copy" onClick={handleCopy}>
                <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
                <Copy
                    className={`size-4 transition-all duration-300 ${copied ? 'scale-0' : 'scale-100'
                        }`}
                />
                <Check
                    className={`absolute inset-0 m-auto size-4 transition-all duration-300 ${copied ? 'scale-100' : 'scale-0'
                        }`}
                />
            </Action>

            <Action
                tooltip="Upvote Response"
                data-testid="message-upvote"
                disabled={vote?.isUpvoted || voteMutation.isPending}
                onClick={() => {
                    toast.promise(
                        voteMutation.mutateAsync({
                            chatId,
                            messageId: message.id,
                            type: 'up',
                        }),
                        {
                            loading: 'Upvoting Response...',
                            success: 'Upvoted Response!',
                            error: 'Failed to upvote response.',
                        }
                    );
                }}
            >
                <ThumbsUpIcon />
            </Action>

            <Action
                tooltip="Downvote Response"
                data-testid="message-downvote"
                disabled={(vote && !vote.isUpvoted) || voteMutation.isPending}
                onClick={() => {
                    toast.promise(
                        voteMutation.mutateAsync({
                            chatId,
                            messageId: message.id,
                            type: 'down',
                        }),
                        {
                            loading: 'Downvoting Response...',
                            success: 'Downvoted Response!',
                            error: 'Failed to downvote response.',
                        }
                    );
                }}
            >
                <ThumbsDownIcon />
            </Action>
        </Actions>
    );
}

export const MessageActions = memo(
    PureMessageActions,
    (prevProps, nextProps) => {
        if (!equal(prevProps.vote, nextProps.vote)) return false;
        if (prevProps.isLoading !== nextProps.isLoading) return false;

        return true;
    },
);