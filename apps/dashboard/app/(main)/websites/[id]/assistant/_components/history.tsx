'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import type { User } from '@databuddy/auth';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    useSidebar,
} from '@/components/ui/sidebar';
import type { Chat } from '@databuddy/db';
import { ChatItem } from './history-item';
import { SpinnerIcon } from '@phosphor-icons/react';
import { trpc } from '@/lib/trpc';

type GroupedChats = {
    today: Chat[];
    yesterday: Chat[];
    lastWeek: Chat[];
    lastMonth: Chat[];
    older: Chat[];
};

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
        (groups, chat) => {
            const chatDate = new Date(chat.createdAt);

            if (isToday(chatDate)) {
                groups.today.push(chat);
            } else if (isYesterday(chatDate)) {
                groups.yesterday.push(chat);
            } else if (chatDate > oneWeekAgo) {
                groups.lastWeek.push(chat);
            } else if (chatDate > oneMonthAgo) {
                groups.lastMonth.push(chat);
            } else {
                groups.older.push(chat);
            }

            return groups;
        },
        {
            today: [],
            yesterday: [],
            lastWeek: [],
            lastMonth: [],
            older: [],
        } as GroupedChats,
    );
};

export function SidebarHistory({ user }: { user: User | undefined }) {
    const { setOpenMobile } = useSidebar();
    const { id } = useParams();

    const {
        data: paginatedChatHistories,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
    } = trpc.assistant.getHistory.useInfiniteQuery(
        {
            websiteId: id as string,
            limit: PAGE_SIZE,
        },
        {
            enabled: !!user && !!id,
            getNextPageParam: (lastPage: any) => {
                if (!lastPage.hasMore) return undefined;
                return lastPage.chats[lastPage.chats.length - 1]?.id;
            },
        }
    );

    const router = useRouter();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const hasReachedEnd = !hasNextPage;
    const hasEmptyChatHistory = paginatedChatHistories?.pages.every((page: any) => page.chats.length === 0) ?? true;

    const handleDelete = (chatId: string) => {
        setDeleteId(chatId);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        // The actual deletion is handled by the ChatItem component
        setShowDeleteDialog(false);

        if (deleteId === id) {
            router.push('/');
        }
    };

    if (!user) {
        return (
            <SidebarGroup>
                <SidebarGroupContent>
                    <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
                        Login to save and revisit previous chats!
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    if (isLoading) {
        return (
            <SidebarGroup>
                <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                    Today
                </div>
                <SidebarGroupContent>
                    <div className="flex flex-col">
                        {[44, 32, 28, 64, 52].map((item) => (
                            <div
                                key={item}
                                className="flex h-8 items-center gap-2 rounded-md px-2"
                            >
                                <div
                                    className="h-4 max-w-(--skeleton-width) flex-1 rounded-md bg-sidebar-accent-foreground/10"
                                    style={
                                        {
                                            '--skeleton-width': `${item}%`,
                                        } as React.CSSProperties
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    if (hasEmptyChatHistory) {
        return (
            <SidebarGroup>
                <SidebarGroupContent>
                    <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
                        Your conversations will appear here once you start chatting!
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    return (
        <>
            <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {paginatedChatHistories &&
                            (() => {
                                const chatsFromHistory = paginatedChatHistories.pages.flatMap(
                                    (page: any) => page.chats,
                                );

                                const groupedChats = groupChatsByDate(chatsFromHistory);

                                return (
                                    <div className="flex flex-col gap-6">
                                        {groupedChats.today.length > 0 && (
                                            <div>
                                                <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                                                    Today
                                                </div>
                                                {groupedChats.today.map((chat) => (
                                                    <ChatItem
                                                        key={chat.id}
                                                        chat={chat}
                                                        isActive={chat.id === id}
                                                        onDelete={handleDelete}
                                                        setOpenMobile={setOpenMobile}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {groupedChats.yesterday.length > 0 && (
                                            <div>
                                                <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                                                    Yesterday
                                                </div>
                                                {groupedChats.yesterday.map((chat) => (
                                                    <ChatItem
                                                        key={chat.id}
                                                        chat={chat}
                                                        isActive={chat.id === id}
                                                        onDelete={handleDelete}
                                                        setOpenMobile={setOpenMobile}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {groupedChats.lastWeek.length > 0 && (
                                            <div>
                                                <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                                                    Last 7 days
                                                </div>
                                                {groupedChats.lastWeek.map((chat) => (
                                                    <ChatItem
                                                        key={chat.id}
                                                        chat={chat}
                                                        isActive={chat.id === id}
                                                        onDelete={handleDelete}
                                                        setOpenMobile={setOpenMobile}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {groupedChats.lastMonth.length > 0 && (
                                            <div>
                                                <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                                                    Last 30 days
                                                </div>
                                                {groupedChats.lastMonth.map((chat) => (
                                                    <ChatItem
                                                        key={chat.id}
                                                        chat={chat}
                                                        isActive={chat.id === id}
                                                        onDelete={handleDelete}
                                                        setOpenMobile={setOpenMobile}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {groupedChats.older.length > 0 && (
                                            <div>
                                                <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                                                    Older than last month
                                                </div>
                                                {groupedChats.older.map((chat) => (
                                                    <ChatItem
                                                        key={chat.id}
                                                        chat={chat}
                                                        isActive={chat.id === id}
                                                        onDelete={handleDelete}
                                                        setOpenMobile={setOpenMobile}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                    </SidebarMenu>

                    <motion.div
                        onViewportEnter={() => {
                            if (!isFetchingNextPage && !hasReachedEnd) {
                                fetchNextPage();
                            }
                        }}
                    />

                    {hasReachedEnd ? (
                        <div className="mt-8 flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
                            You have reached the end of your chat history.
                        </div>
                    ) : (
                        <div className="mt-8 flex flex-row items-center gap-2 p-2 text-zinc-500 dark:text-zinc-400">
                            <div className="animate-spin">
                                <SpinnerIcon />
                            </div>
                            <div>Loading Chats...</div>
                        </div>
                    )}
                </SidebarGroupContent>
            </SidebarGroup>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            chat and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}