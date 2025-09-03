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

const AIAssistantMain = dynamic(
	() => import('./components/ai-assistant-main'),
	{
		loading: () => <AIAssistantLoadingSkeleton />,
		ssr: false,
	}
);

function AIAssistantLoadingSkeleton() {
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
			<div className="flex flex-[2_2_0%] flex-col overflow-hidden bg-background">
				<div className="flex-shrink-0 border-sidebar-border border-b p-4">
					<Skeleton className="mb-2 h-4 w-32" />
					<Skeleton className="h-3 w-48" />
				</div>
				<div className="flex-1 space-y-3 overflow-y-auto p-4">
					<div className="flex gap-3">
						<Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
						<Skeleton className="h-12 w-3/4 rounded-lg" />
					</div>
					<div className="ml-auto flex flex-row-reverse gap-3">
						<Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
						<Skeleton className="h-8 w-1/2 rounded-lg" />
					</div>
				</div>
				<div className="flex-shrink-0 border-sidebar-border border-t p-4">
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
			</div>
			<div className="flex flex-[3_3_0%] flex-col overflow-hidden border-sidebar-border border-l bg-background">
				<div className="flex-shrink-0 border-sidebar-border border-b p-4">
					<Skeleton className="mb-2 h-4 w-32" />
				</div>
				<div className="flex-1 p-4">
					<Skeleton className="h-full w-full rounded-lg" />
				</div>
			</div>
		</div>
	);
}

export default function AssistantPage() {
	const { id } = useParams();
	const { data: websiteData, isLoading } = useWebsite(id as string);
	const [, setWebsiteId] = useAtom(websiteIdAtom);
	const [, setWebsiteData] = useAtom(websiteDataAtom);
	const [, setDateRange] = useAtom(dateRangeAtom);

	useEffect(() => {
		if (id) {
			setWebsiteId(id as string);
		}
		if (websiteData) {
			setWebsiteData(websiteData);
		}
		setDateRange({
			start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
			end_date: new Date().toISOString(),
			granularity: 'daily',
		});
	}, [id, setWebsiteId, websiteData, setWebsiteData, setDateRange]);

	if (isLoading || !websiteData) {
		return <AIAssistantLoadingSkeleton />;
	}

	return (
		<div className="h-full min-h-0">
			<AIAssistantMain />
		</div>
	);
}
