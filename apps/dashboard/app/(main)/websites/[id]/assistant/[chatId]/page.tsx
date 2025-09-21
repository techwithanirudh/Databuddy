
import { notFound } from 'next/navigation';
import Chat from '../_components/chat';
import { getChatById, getMessagesByChatId } from '@databuddy/ai/lib/queries';
import { cache, Suspense } from 'react';
import { headers } from 'next/headers';
import { auth } from '@databuddy/auth';
import { convertToUIMessages } from '@databuddy/ai/lib/utils';
import { DEFAULT_CHAT_MODEL } from '@databuddy/ai/models';
import { ChatSkeleton } from '../_components/chat-skeleton';

const getSession = cache(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    return session;
});

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
