
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Chat from '../_components/chat';
import { getChatById, getMessagesByChatId } from '@databuddy/ai/lib/queries';
import { cache, Suspense } from 'react';
import { headers } from 'next/headers';
import { auth } from '@databuddy/auth';
import { convertToUIMessages } from '@databuddy/ai/lib/utils';
import { DEFAULT_CHAT_MODEL } from '@databuddy/ai/models';


const getSession = cache(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    return session;
});

function ChatSkeleton() {
    return (
        <div className="flex h-full flex-col overflow-hidden rounded border bg-background w-full">
            {/* Header Skeleton */}
            <div className="flex flex-shrink-0 items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div>
                        <Skeleton className="mb-2 h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
                <Skeleton className="h-8 w-8 rounded" />
            </div>
            {/* Messages Area Skeleton */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
                <div className="flex gap-3">
                    <Skeleton className="h-12 w-3/4 rounded" />
                </div>
                <div className="ml-auto flex flex-row-reverse gap-3">
                    <Skeleton className="h-10 w-1/2 rounded" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-16 w-4/5 rounded" />
                </div>
            </div>
            {/* Input Area Skeleton */}
            <div className="flex-shrink-0 border-t p-4">
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 rounded" />
                    <Skeleton className="h-10 w-10 rounded" />
                </div>
            </div>
        </div>
    );
}

export default async function ChatPage(props: { params: Promise<{ id: string, chatId: string }> }) {
    const params = await props.params;
    const { id: websiteId, chatId } = params;
    const chat = await getChatById({ id: chatId });
    const session = await getSession();

    if (!chat) {
        notFound();
    }

    if (session?.user?.id !== chat.userId) {
        notFound();
    }   
    const messagesFromDb = await getMessagesByChatId({
        id: chatId,
    });

    const uiMessages = convertToUIMessages(messagesFromDb);


    return (
        <div className="h-full min-h-0">
            <Suspense fallback={<ChatSkeleton />}>
                <Chat id={chatId} websiteId={websiteId} initialMessages={uiMessages} initialChatModel={DEFAULT_CHAT_MODEL} />
            </Suspense>
        </div>
    );
}
