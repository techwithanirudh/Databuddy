import { Skeleton } from "@/components/ui/skeleton";

export function OrganizationPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
            {/* Header Skeleton */}
            <div className="p-6 rounded border border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <Skeleton className="h-9 w-32" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-4">
                <div className="border-b">
                    <div className="h-10 flex items-center gap-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                </div>
                <div className="space-y-4 mt-4">
                    <Skeleton className="h-32 w-full rounded" />
                    <Skeleton className="h-48 w-full rounded" />
                </div>
            </div>
        </div>
    );
} 