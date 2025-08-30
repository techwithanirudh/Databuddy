'use client';

import { ArrowRightIcon, GlobeIcon, PencilIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WebsiteHeaderProps } from '../../utils/types';

export function WebsiteHeader({
	websiteData,
	websiteId,
	onEditClick,
}: WebsiteHeaderProps) {
	return (
		<Card className="rounded border bg-background py-0 shadow-sm">
			<CardContent className="p-6">
				<div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-3">
							<div className="rounded bg-primary/10 p-2">
								<GlobeIcon className="h-5 w-5 text-primary" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h1 className="font-bold text-2xl tracking-tight">
										{websiteData.name || 'Unnamed Website'}
									</h1>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													className="h-8 gap-1 px-2 text-muted-foreground transition-colors hover:text-foreground"
													onClick={onEditClick}
													size="sm"
													variant="ghost"
												>
													<PencilIcon className="h-3.5 w-3.5" />
													<span className="text-xs">Edit</span>
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												<p className="text-xs">Edit website details</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
								<div className="mt-1 flex items-center gap-2 text-muted-foreground text-sm">
									<a
										className="flex items-center gap-1 transition-colors hover:text-foreground hover:underline"
										href={websiteData.domain}
										rel="noopener noreferrer"
										target="_blank"
									>
										{websiteData.domain}
										<ArrowRightIcon className="h-3 w-3" />
									</a>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-4 text-muted-foreground text-xs">
							<div className="flex items-center gap-1">
								<span>Created:</span>
								<span>
									{new Date(websiteData.createdAt).toLocaleDateString()}
								</span>
							</div>
							<div className="flex items-center gap-1">
								<span>ID:</span>
								<code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
									{websiteId.substring(0, 8)}...
								</code>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-3 lg:items-end">
						<div className="flex items-center gap-2">
							<Badge
								className="gap-2 border-green-200 bg-green-50 px-3 py-1 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
								variant="outline"
							>
								<span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
								<span className="font-medium">Active</span>
							</Badge>
						</div>

						<div className="text-right text-muted-foreground text-xs">
							<p>Analytics tracking is enabled</p>
							<p>Data collection in progress</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
