'use client';

import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebsite } from '@/hooks/use-websites';
import {
	dateRangeAtom,
	websiteDataAtom,
	websiteIdAtom,
} from '@/stores/jotai/assistantAtoms';
import { generateUUID } from '@databuddy/ai/lib/utils';

const AIChat = dynamic(() => import('./_components/chat'), {
	loading: () => <ChatSkeleton />,
	ssr: false,
});

function ChatSkeleton() {
	return (
		<div className="flex h-full min-h-0 flex-col gap-2">
			<div className="flex min-h-0 flex-1 gap-2 overflow-hidden">
				<div className="flex flex-[2_2_0%] flex-col overflow-hidden rounded border bg-background">
					<div className="flex-shrink-0 border-b p-2">
						<Skeleton className="mb-1 h-4 w-32" />
						<Skeleton className="h-3 w-48" />
					</div>
					<div className="flex-1 space-y-2 overflow-y-auto p-2">
						<div className="flex gap-2">
							<Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
							<Skeleton className="h-12 w-3/4 rounded" />
						</div>
						<div className="ml-auto flex flex-row-reverse gap-2">
							<Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
							<Skeleton className="h-8 w-1/2 rounded" />
						</div>
					</div>
					<div className="flex-shrink-0 border-t p-2">
						<Skeleton className="h-8 w-full rounded" />
					</div>
				</div>
				<div className="flex flex-[3_3_0%] flex-col overflow-hidden rounded border bg-background">
					<div className="flex-shrink-0 border-b p-2">
						<Skeleton className="mb-1 h-4 w-32" />
					</div>
					<div className="flex-1 p-2">
						<Skeleton className="h-full w-full rounded" />
					</div>
				</div>
			</div>
		</div>
	);
}

export default function ChatPage() {
	const { id: siteId } = useParams();
  	const chatId = generateUUID();

	const { data: websiteData, isLoading } = useWebsite(siteId);
	const [, setWebsiteId] = useAtom(websiteIdAtom);
	const [, setWebsiteData] = useAtom(websiteDataAtom);
	const [, setDateRange] = useAtom(dateRangeAtom);

	useEffect(() => {
		if (siteId) {
			setWebsiteId(siteId as string);
		}

		if (websiteData) {
			setWebsiteData(websiteData);
		}

		setDateRange({
			start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
			end_date: new Date().toISOString(),
			granularity: 'daily',
		});
	}, [siteId, setWebsiteId, websiteData, setWebsiteData, setDateRange]);

	if (isLoading || !websiteData) {
		return <ChatSkeleton />;
	}

	return (
		<div className="h-full min-h-0">
			<AIChat id={chatId} />
		</div>
	);
}
