"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Warning, ArrowClockwise } from "@phosphor-icons/react";

interface ErrorDisplayProps {
    error?: Error | null;
    onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
    return (
        <div className="flex items-center justify-center w-full py-8">
            <Card className="max-w-lg w-full border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <Warning className="h-5 w-5" />
                        Failed to load organizations
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        An error occurred while fetching your organization data. Please try again.
                    </p>
                    {error && (
                        <pre className="p-3 bg-muted rounded text-xs font-mono overflow-auto max-h-[150px]">
                            {error.message}
                        </pre>
                    )}
                    {onRetry && (
                        <Button onClick={onRetry} size="sm" variant="outline">
                            <ArrowClockwise className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 