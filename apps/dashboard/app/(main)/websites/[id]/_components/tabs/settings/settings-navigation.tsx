'use client';

import {
	ArrowRightIcon,
	BookOpenIcon,
	DownloadIcon,
	FileCodeIcon,
	ShareIcon,
	TrashIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { SettingsNavigationProps } from '../../utils/types';

export function SettingsNavigation({
	activeTab,
	setActiveTab,
	onDeleteClick,
}: SettingsNavigationProps) {
	return (
		<div className="col-span-12 lg:col-span-5 xl:col-span-3">
			<Card className="rounded border bg-background py-0 shadow-sm">
				<CardContent className="p-4">
					<div className="sticky top-4 space-y-2">
						<div className="px-3 py-2">
							<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
								Settings
							</h3>
						</div>

						<Button
							className="h-10 w-full justify-between gap-2 transition-all duration-200"
							onClick={() => setActiveTab('privacy')}
							variant={activeTab === 'privacy' ? 'default' : 'ghost'}
						>
							<div className="flex items-center gap-2">
								<ShareIcon className="h-4 w-4" />
								<span>Sharing & Privacy</span>
							</div>
						</Button>

						<Button
							className="h-10 w-full justify-between gap-2 transition-all duration-200"
							onClick={() => setActiveTab('export')}
							variant={activeTab === 'export' ? 'default' : 'ghost'}
						>
							<div className="flex items-center gap-2">
								<DownloadIcon className="h-4 w-4" />
								<span>Data Export</span>
							</div>
							<div className="flex items-center gap-1">
								<Badge className="h-5 px-2 text-xs" variant="secondary">
									ZIP
								</Badge>
								<Badge
									className="h-5 bg-orange-100 px-2 text-orange-800 text-xs dark:bg-orange-900/20 dark:text-orange-300"
									variant="secondary"
								>
									Alpha
								</Badge>
							</div>
						</Button>

						<div className="border-t pt-4">
							<div className="px-3 py-2">
								<h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
									Resources
								</h3>
							</div>

							<Link href="https://www.databuddy.cc/docs" target="_blank">
								<Button
									className="h-9 w-full justify-start gap-2 transition-all duration-200 hover:bg-muted/50"
									variant="ghost"
								>
									<BookOpenIcon className="h-4 w-4" />
									<span>Documentation</span>
									<ArrowRightIcon className="ml-auto h-3 w-3" />
								</Button>
							</Link>

							<Link href="https://www.databuddy.cc/docs/api" target="_blank">
								<Button
									className="h-9 w-full justify-start gap-2 transition-all duration-200 hover:bg-muted/50"
									variant="ghost"
								>
									<FileCodeIcon className="h-4 w-4" />
									<span>API Reference</span>
									<ArrowRightIcon className="ml-auto h-3 w-3" />
								</Button>
							</Link>
						</div>

						<div className="border-t pt-4">
							<Button
								className="h-9 w-full justify-start gap-2 text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
								onClick={onDeleteClick}
								variant="ghost"
							>
								<TrashIcon className="h-4 w-4" />
								<span>Delete Website</span>
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
