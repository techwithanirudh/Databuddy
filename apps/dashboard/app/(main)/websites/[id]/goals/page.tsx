"use client";

import { useState, useMemo, useCallback, lazy, Suspense, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useWebsite } from "@/hooks/use-websites";
import { useAtom } from "jotai";
import {
    dateRangeAtom,
    timeGranularityAtom,
    formattedDateRangeAtom,
} from "@/stores/jotai/filterAtoms";
import { Card, CardContent } from "@/components/ui/card";
import { TrendDownIcon } from "@phosphor-icons/react";
import {
    useFunnels,
    useBulkGoalAnalytics,
    useAutocompleteData,
    type Funnel,
    type CreateFunnelData,
} from "@/hooks/use-funnels";

import { PageHeader } from "./_components/page-header";
import { GoalsList } from "./_components/goals-list";
import { EditGoalDialog } from "./_components/edit-goal-dialog";
import { DeleteGoalDialog } from "./_components/delete-goal-dialog";

const PageHeaderSkeleton = () => (
    <div className="space-y-6">
        <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted animate-pulse rounded-xl"></div>
                        <div>
                            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2"></div>
                            <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
                    <div className="h-10 w-36 bg-muted animate-pulse rounded-lg"></div>
                </div>
            </div>
        </div>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
            </div>
        </div>
    </div>
);

const GoalsListSkeleton = () => (
    <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse rounded-xl">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-6 bg-muted rounded-lg w-48"></div>
                                <div className="h-4 w-4 bg-muted rounded"></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 bg-muted rounded-full w-16"></div>
                                <div className="h-4 bg-muted rounded w-20"></div>
                            </div>
                        </div>
                        <div className="h-8 w-8 bg-muted rounded"></div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                        <div className="bg-muted/50 rounded-lg p-3">
                            <div className="h-3 bg-muted rounded w-24 mb-2"></div>
                            <div className="flex gap-2">
                                <div className="h-8 bg-muted rounded-lg w-32"></div>
                                <div className="h-4 w-4 bg-muted rounded"></div>
                                <div className="h-8 bg-muted rounded-lg w-28"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        ))}
    </div>
);

export default function GoalsPage() {
    const { id } = useParams();
    const websiteId = id as string;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Funnel | null>(null);
    const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

    // Intersection observer for lazy loading
    const [isVisible, setIsVisible] = useState(false);
    const pageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (pageRef.current) {
            observer.observe(pageRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const [,] = useAtom(dateRangeAtom);
    const [currentGranularity] = useAtom(timeGranularityAtom);
    const [formattedDateRangeState] = useAtom(formattedDateRangeAtom);

    const memoizedDateRangeForTabs = useMemo(() => ({
        start_date: formattedDateRangeState.startDate,
        end_date: formattedDateRangeState.endDate,
        granularity: currentGranularity,
    }), [formattedDateRangeState, currentGranularity]);

    const { data: websiteData } = useWebsite(websiteId);

    // Filter funnels to only show single-step goals
    const {
        data: allFunnels,
        isLoading: funnelsLoading,
        error: funnelsError,
        refetch: refetchFunnels,
        createFunnel,
        updateFunnel,
        deleteFunnel,
        isCreating,
        isUpdating,
    } = useFunnels(websiteId);

    // Filter to only single-step funnels (goals)
    const goals = useMemo(() => {
        return allFunnels?.filter(funnel => funnel.steps?.length === 1) || [];
    }, [allFunnels]);

    // Get goal IDs for bulk analytics
    const goalIds = useMemo(() => goals.map(goal => goal.id), [goals]);

    // Fetch analytics for all goals
    const {
        goalAnalytics,
        isLoading: analyticsLoading,
        error: analyticsError,
        refetch: refetchAnalytics
    } = useBulkGoalAnalytics(websiteId, goalIds, memoizedDateRangeForTabs);

    // Preload autocomplete data for instant suggestions in dialogs
    const autocompleteQuery = useAutocompleteData(websiteId);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([refetchFunnels(), autocompleteQuery.refetch()]);
            if (goalIds.length > 0) {
                refetchAnalytics();
            }
        } catch (error) {
            console.error("Failed to refresh goal data:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchFunnels, refetchAnalytics, autocompleteQuery.refetch, goalIds.length]);

    const handleCreateGoal = async (data: CreateFunnelData) => {
        try {
            // Ensure it's a single-step goal
            const goalData = {
                ...data,
                steps: data.steps.slice(0, 1) // Only take the first step
            };
            await createFunnel(goalData);
            setIsDialogOpen(false);
            setEditingGoal(null);
        } catch (error) {
            console.error("Failed to create goal:", error);
        }
    };

    const handleUpdateGoal = async (goal: Funnel) => {
        try {
            // Ensure it's a single-step goal
            const goalData = {
                ...goal,
                steps: goal.steps.slice(0, 1) // Only take the first step
            };
            await updateFunnel({
                funnelId: goal.id,
                updates: {
                    name: goalData.name,
                    description: goalData.description,
                    steps: goalData.steps,
                    filters: goalData.filters
                }
            });
            setIsDialogOpen(false);
            setEditingGoal(null);
        } catch (error) {
            console.error("Failed to update goal:", error);
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        try {
            await deleteFunnel(goalId);
            setDeletingGoalId(null);
        } catch (error) {
            console.error("Failed to delete goal:", error);
        }
    };

    if (funnelsError) {
        return (
            <div className="p-6 max-w-[1600px] mx-auto">
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <TrendDownIcon size={16} weight="duotone" className="h-5 w-5 text-red-600" />
                            <p className="text-red-600 font-medium">Error loading goal data</p>
                        </div>
                        <p className="text-red-600/80 text-sm mt-2">{funnelsError.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div ref={pageRef} className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
            <Suspense fallback={<PageHeaderSkeleton />}>
                <PageHeader
                    websiteName={websiteData?.name || ''}
                    goalsCount={goals.length}
                    isRefreshing={isRefreshing}
                    isLoading={funnelsLoading}
                    hasError={!!funnelsError}
                    onRefresh={handleRefresh}
                    onCreateGoal={() => {
                        setEditingGoal(null);
                        setIsDialogOpen(true);
                    }}
                />
            </Suspense>

            <Suspense fallback={<GoalsListSkeleton />}>
                <GoalsList
                    goals={goals}
                    isLoading={funnelsLoading}
                    onEditGoal={(goal: Funnel) => {
                        setEditingGoal(goal);
                        setIsDialogOpen(true);
                    }}
                    onDeleteGoal={setDeletingGoalId}
                    onCreateGoal={() => {
                        setEditingGoal(null);
                        setIsDialogOpen(true);
                    }}
                    goalAnalytics={goalAnalytics}
                    analyticsLoading={analyticsLoading}
                />
            </Suspense>

            {isDialogOpen && (
                <Suspense fallback={null}>
                    <EditGoalDialog
                        isOpen={isDialogOpen}
                        onClose={() => {
                            setIsDialogOpen(false);
                            setEditingGoal(null);
                        }}
                        onSubmit={handleUpdateGoal}
                        onCreate={handleCreateGoal}
                        goal={editingGoal}
                        isUpdating={isUpdating}
                        isCreating={isCreating}
                        autocompleteData={autocompleteQuery.data}
                    />
                </Suspense>
            )}

            {!!deletingGoalId && (
                <Suspense fallback={null}>
                    <DeleteGoalDialog
                        isOpen={!!deletingGoalId}
                        onClose={() => setDeletingGoalId(null)}
                        onConfirm={() => deletingGoalId && handleDeleteGoal(deletingGoalId)}
                    />
                </Suspense>
            )}
        </div>
    );
} 