'use client';

import { EnvelopeIcon, PlusIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyReportsStateProps {
	onCreateReport?: () => void;
}

export function EmptyReportsState({
	onCreateReport,
}: EmptyReportsStateProps = {}) {
	return (
		<Card className="rounded border-2 border-border/60 border-dashed">
			<CardContent className="flex flex-col items-center justify-center py-20 text-center">
				<div className="mb-6 rounded-full bg-muted/50 p-6">
					<EnvelopeIcon className="h-10 w-10 text-muted-foreground/60" />
				</div>

				<div className="mb-8 space-y-3">
					<h3 className="font-semibold text-foreground text-xl">
						No reports yet
					</h3>
					<p className="max-w-sm text-muted-foreground leading-relaxed">
						Create your first automated report to get regular analytics insights
						delivered straight to your inbox.
					</p>
				</div>

				<div className="space-y-4">
					<Button
						className={cn(
							'gap-2 px-8 py-4 font-medium text-base',
							'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary',
							'group relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl'
						)}
						onClick={onCreateReport}
						size="lg"
					>
						<div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover:translate-x-[100%]" />
						<PlusIcon className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
						<span className="relative z-10">Create Your First Report</span>
					</Button>

					<p className="text-muted-foreground/80 text-xs">
						Start with a template or build from scratch
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
