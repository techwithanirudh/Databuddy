import { Skeleton } from '@/components/ui/skeleton';

export function ChatSkeleton() {
    return (
        <div className="flex size-full items-center justify-center divide-x divide-border gap-2">
            <div className="relative size-full border border-border rounded-2xl flex flex-col transition-all duration-300 ease-in-out">
                {/* Header (matches ChatHeader) */}
                <div className="relative z-10 bg-background py-6 flex justify-between w-full px-6 border-b border-border rounded-t-2xl">
                    <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>

                    <div className="flex items-center justify-center transition-all duration-300 ease-in-out">
                        <Skeleton className="h-4 w-48" />
                    </div>

                    <div className="flex items-center space-x-4 transition-all duration-300 ease-in-out">
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                </div>

                {/* Messages container (matches Messages wrapper) */}
                <div className="relative flex flex-col flex-1 h-full pb-6 px-6 overflow-y-auto">
                    <div className="flex min-w-0 flex-col gap-4 md:gap-6">
                        <div className="flex flex-col gap-2 px-2 py-4 md:gap-4 md:px-4 h-full">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={i % 2 === 0 ? 'group flex w-full items-end justify-end gap-2' : 'group flex w-full items-end flex-row-reverse justify-end gap-2'}
                                >
                                    <div className={i % 2 === 0 ? 'is-user:dark flex flex-col gap-2 overflow-hidden rounded-lg text-sm max-w-[80%] px-4 py-3 group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground' : 'is-assistant:dark flex flex-col gap-2 overflow-hidden rounded-lg text-sm max-w-[80%] px-4 py-3 group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground'}>
                                        <Skeleton className="h-22 w-64 mb-2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Input area (matches PromptInput container) */}
                <div className="mt-4 border-t border-border h-min p-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 flex-1 rounded" />
                        <Skeleton className="h-10 w-10 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
