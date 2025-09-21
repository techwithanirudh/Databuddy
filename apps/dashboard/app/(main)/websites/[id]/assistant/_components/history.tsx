"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { ListIcon, MagnifyingGlassIcon, TrashIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react";

type Chat = {
    id: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
};

function ChatHistorySkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 10 }, (_, i) => (
                <div key={`chat-skeleton-${i + 1}`} className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );
}

export function ChatHistory({ websiteId }: { websiteId: string }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // Debounced search to avoid too many API calls
    const debouncedSearch = useDebounceCallback(setSearchQuery, 300);

    const historyKey = [
        'assistant.getHistory',
        { websiteId: websiteId, limit: 20, search: searchQuery || undefined },
    ] as const as QueryKey;

    // Fetch chats with search functionality
    const { data: chats, isLoading } = trpc.assistant.getHistory.useQuery({
        websiteId: websiteId,
        limit: 20,
        search: searchQuery || undefined, 
    }, {
        enabled: isOpen,
    });

    // Delete chat mutation with optimistic updates
    const deleteChatMutation = trpc.assistant.deleteChat.useMutation({
        onMutate: async ({ chatId }) => {
            await queryClient.cancelQueries(historyKey);

            const previousChats = queryClient.getQueryData(historyKey);

            // Optimistically update the cache
            queryClient.setQueryData(historyKey, (old: any) => {
                if (!old?.chats) return old;
                return {
                    ...old,
                    chats: old.chats.filter((chat: Chat) => chat.id !== chatId),
                };
            });

            return { previousChats };
        },
        onError: (_, __, context) => {
            // Restore previous data on error
            if (context?.previousChats) {
                queryClient.setQueryData(historyKey, context.previousChats);
            }
        },
        onSettled: () => {
            // Refetch after error or success
            queryClient.invalidateQueries(historyKey);
        },
    });

    const handleChatSelect = (chatId: string) => {
        router.push(`/websites/${websiteId}/assistant/${chatId}`);
        setIsOpen(false);
    };

    const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        deleteChatMutation.mutate({ chatId: chatId });
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                    <ClockCounterClockwiseIcon size={16} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0" align="end">
                <div className="p-4">
                    <div className="relative mb-4">
                        <MagnifyingGlassIcon
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                            size={14}
                        />
                        <Input
                            placeholder="Search history"
                            className="pl-9"
                            onChange={(e) => debouncedSearch(e.target.value)}
                        />
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            <ChatHistorySkeleton />
                        ) : chats?.chats?.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-sm text-muted-foreground">
                                    {searchQuery ? "No chats found" : "No chat history"}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1 pr-2">
                                {chats?.chats?.map((chat: Chat) => (
                                    <div
                                        key={chat.id}
                                        className="group relative flex items-center justify-between hover:bg-muted/50 rounded-md p-2"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleChatSelect(chat.id)}
                                            className="flex-1 text-left"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <div className="text-sm font-medium line-clamp-1">
                                                    {chat.title || "New chat"}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(chat.updatedAt, {
                                                        addSuffix: true,
                                                    })}
                                                </div>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteChat(e, chat.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-destructive/10 rounded-sm"
                                            title="Delete chat"
                                        >
                                            <TrashIcon
                                                size={14}
                                                className="text-muted-foreground hover:text-destructive"
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}