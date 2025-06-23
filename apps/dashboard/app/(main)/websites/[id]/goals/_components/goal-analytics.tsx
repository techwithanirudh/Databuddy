"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendUp, Users, Target, ArrowClockwise } from "@phosphor-icons/react";

interface GoalAnalyticsProps {
    isLoading: boolean;
    error: Error | null;
    data: any;
    summaryStats: {
        totalUsers: number;
        conversionRate: number;
        completions: number;
    };
    onRetry: () => void;
}

export function GoalAnalytics({
    isLoading,
    error,
    data,
    summaryStats,
    onRetry
}: GoalAnalyticsProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse rounded">
                            <CardContent className="p-6">
                                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                                <div className="h-8 bg-muted rounded w-16"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-600 font-medium">Failed to load goal analytics</p>
                            <p className="text-red-600/80 text-sm mt-1">{error.message}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            className="gap-2"
                        >
                            <ArrowClockwise size={16} weight="duotone" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data?.success || !data.data) {
        return (
            <Card className="rounded">
                <CardContent className="p-6">
                    <p className="text-muted-foreground text-center">No analytics data available</p>
                </CardContent>
            </Card>
        );
    }

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toLocaleString();
    };

    const formatPercentage = (num: number) => {
        return `${num.toFixed(1)}%`;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Users */}
                <Card className="rounded">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <Users size={20} weight="duotone" className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatNumber(summaryStats.totalUsers)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Completions */}
                <Card className="rounded">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <Target size={20} weight="duotone" className="text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Completions</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatNumber(summaryStats.completions)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Conversion Rate */}
                <Card className="rounded">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                <TrendUp size={20} weight="duotone" className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatPercentage(summaryStats.conversionRate)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Goal Details */}
            <Card className="rounded">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Goal Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-muted/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Performance Summary</span>
                                <span className="text-xs text-muted-foreground">
                                    {data.date_range?.start_date} - {data.date_range?.end_date}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Users who reached goal</p>
                                    <p className="text-lg font-semibold">
                                        {formatNumber(summaryStats.completions)} / {formatNumber(summaryStats.totalUsers)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Success rate</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        {formatPercentage(summaryStats.conversionRate)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {data.data.avg_completion_time > 0 && (
                            <div className="bg-muted/30 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Average Time to Complete</span>
                                    <span className="text-sm font-semibold">
                                        {data.data.avg_completion_time_formatted || `${Math.round(data.data.avg_completion_time)}s`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 