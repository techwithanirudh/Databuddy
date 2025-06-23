"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    PencilSimple,
    Trash,
    Eye,
    MouseMiddleClick,
    DotsThreeIcon
} from "@phosphor-icons/react";
import { type Funnel } from "@/hooks/use-funnels";

interface GoalCardProps {
    goal: Funnel;
    onEdit: () => void;
    onDelete: () => void;
    conversionRate?: number;
    totalUsers?: number;
    completions?: number;
    isLoading?: boolean;
}

export function GoalCard({
    goal,
    onEdit,
    onDelete,
    conversionRate = 0,
    totalUsers = 0,
    completions = 0,
    isLoading = false
}: GoalCardProps) {
    const step = goal.steps[0]; // Only one step for goals

    const getStepIcon = (type: string) => {
        switch (type) {
            case 'PAGE_VIEW':
                return <Eye size={16} className="text-muted-foreground" />;
            case 'EVENT':
                return <MouseMiddleClick size={16} className="text-muted-foreground" />;
            default:
                return <Eye size={16} className="text-muted-foreground" />;
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <Card className="group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    {/* Left side - Goal info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                                {goal.name}
                            </h3>
                            {!goal.isActive && (
                                <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded font-medium">
                                    Paused
                                </span>
                            )}
                        </div>

                        {/* Goal target */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getStepIcon(step.type)}
                            <span className="truncate">{step?.target || 'No target'}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <DotsThreeIcon size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>
                                <PencilSimple size={16} className="mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash size={16} className="mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Stats section */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    {/* Conversion Rate */}
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Conversion</div>
                        <div className="text-xl font-semibold text-foreground">
                            {isLoading ? (
                                <div className="w-10 h-5 bg-muted animate-pulse rounded"></div>
                            ) : (
                                `${conversionRate.toFixed(1)}%`
                            )}
                        </div>
                    </div>

                    {/* Total Users */}
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Users</div>
                        <div className="text-lg font-medium text-foreground">
                            {isLoading ? (
                                <div className="w-8 h-4 bg-muted animate-pulse rounded"></div>
                            ) : (
                                formatNumber(totalUsers)
                            )}
                        </div>
                    </div>

                    {/* Completions */}
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Completions</div>
                        <div className="text-lg font-medium text-foreground">
                            {isLoading ? (
                                <div className="w-8 h-4 bg-muted animate-pulse rounded"></div>
                            ) : (
                                formatNumber(completions)
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 