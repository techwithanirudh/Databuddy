"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WarningIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/20">
            <Card className="max-w-lg w-full border-destructive/50 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <WarningIcon size={24} weight="duotone" className="h-6 w-6" />
                        Something went wrong
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <p className="text-sm text-muted-foreground">
                        We encountered an unexpected error. Please try again. If the problem persists, please contact support.
                    </p>
                    <pre className="p-3 bg-muted rounded text-xs font-mono overflow-auto max-h-[150px]">
                        {error.message || "An unknown error occurred."}
                    </pre>
                    <Button onClick={() => reset()} size="sm">
                        <ArrowClockwiseIcon size={16} className="h-4 w-4 mr-2" />
                        Try again
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 