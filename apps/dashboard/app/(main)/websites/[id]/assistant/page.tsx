import { generateUUID } from '@databuddy/ai/lib/utils';
import Chat from './_components/chat';
import { Suspense } from 'react';
import { DEFAULT_CHAT_MODEL } from '@databuddy/ai/models';
import { ChatSkeleton } from './_components/chat-skeleton';

export default async function ChatPage(props: { params: Promise<{ id: string }> }) {
	const params = await props.params;
	const { id: websiteId } = params;
	const chatId = generateUUID();

	return (
		<div className="h-full min-h-0">
			<Suspense fallback={<ChatSkeleton />}>
				<Chat id={chatId} websiteId={websiteId} initialMessages={[]} initialChatModel={DEFAULT_CHAT_MODEL} />
			</Suspense>
		</div>
	);
}
