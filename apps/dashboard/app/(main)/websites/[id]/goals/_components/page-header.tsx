"use client";

import { ArrowClockwise, Target, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
    websiteName: string;
    goalsCount: number;
    isRefreshing: boolean;
    isLoading: boolean;
    hasError: boolean;
    onRefresh: () => void;
    onCreateGoal: () => void;
}

export function PageHeader({
    websiteName,
    goalsCount,
    isRefreshing,
    isLoading,
    hasError,
    onRefresh,
    onCreateGoal
}: PageHeaderProps) {
    return (
        <div className="pb-8 mb-6 border-b border-border/50 bg-gradient-to-r from-background via-background to-muted/20 -mx-6 px-6 pt-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <Target size={24} weight="duotone" className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                            Goals
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {isLoading ? (
                                <span className="inline-block w-16 h-4 bg-muted animate-pulse rounded"></span>
                            ) : (
                                `${goalsCount} active goal${goalsCount !== 1 ? 's' : ''} • Track key conversions`
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        variant="outline"
                        className="gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                    >
                        <ArrowClockwise size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                    <Button
                        onClick={onCreateGoal}
                        className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        <Plus size={16} />
                        Create Goal
                    </Button>
                </div>
            </div>
        </div>
    );
} 