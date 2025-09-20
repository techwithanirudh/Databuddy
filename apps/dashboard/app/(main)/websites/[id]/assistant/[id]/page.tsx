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

export default function ChatPage() {
    const { id: siteId, chatId } = useParams();

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
