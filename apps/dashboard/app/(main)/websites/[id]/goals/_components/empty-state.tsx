"use client";

import { Target, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
    onCreateGoal: () => void;
}

export function EmptyState({ onCreateGoal }: EmptyStateProps) {
    return (
        <Card className="rounded border-dashed border-2 border-muted-foreground/25">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-muted/50 rounded-full mb-4">
                    <Target size={24} weight="duotone" className="text-muted-foreground" />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                    No goals yet
                </h3>

                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    Track conversions like sign-ups, purchases, or button clicks
                </p>

                <Button
                    onClick={onCreateGoal}
                    className="gap-2"
                >
                    <Plus size={16} />
                    Create Goal
                </Button>
            </CardContent>
        </Card>
    );
} 