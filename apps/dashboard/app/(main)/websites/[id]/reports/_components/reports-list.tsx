'use client';

import {
	CalendarIcon,
	ClockIcon,
	CopyIcon,
	DotsThreeIcon,
	EnvelopeIcon,
	PencilIcon,
	PlayIcon,
	StopIcon,
	TrashIcon,
	WarningIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { fmtLocal } from '@/lib/date';
import {
	useCloneReport,
	useReports,
	useToggleReport,
} from '../_hooks/use-reports';
import { ReportDialog } from './create-report-dialog';
import { DeleteReportDialog } from './delete-report-dialog';
import { EmptyReportsState } from './empty-reports-state';

interface ReportsListProps {
	websiteId: string;
	onCreateReport?: () => void;
}

export function ReportsList({ websiteId, onCreateReport }: ReportsListProps) {
	const { data: reports, isLoading } = useReports({ websiteId });

	if (isLoading) {
		return <ReportsListSkeleton />;
	}

	if (!reports || reports.length === 0) {
		return <EmptyReportsState onCreateReport={onCreateReport} />;
	}

	return (
		<div className="space-y-4">
			{reports.map((report) => (
				<ReportCard key={report.id} report={report} />
			))}
		</div>
	);
}

interface Report {
	id: string;
	name: string;
	description: string | null;
	websiteId: string | null;
	scheduleType?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | null;
	scheduleTime?: string | null;
	scheduleDay?: number | null;
	timezone?: string | null;
	enabled: boolean;
	lastSentAt?: string | null;
	nextScheduledAt?: string | null;
	recipients?: unknown;
	sections?: unknown;
}

function ReportCard({ report }: { report: Report }) {
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const toggleReportMutation = useToggleReport();
	const cloneReportMutation = useCloneReport();

	const formatRelativeTime = (dateString: string) => {
		return fmtLocal(dateString, 'MMM DD, YYYY HH:mm');
	};

	const formatNextRunTime = (dateString: string | null) => {
		if (!dateString) {
			return 'Not scheduled';
		}
		return fmtLocal(dateString, 'MMM DD, HH:mm');
	};

	const handleToggle = async () => {
		try {
			await toggleReportMutation.mutateAsync({
				id: report.id,
				enabled: !report.enabled,
			});
			toast.success(report.enabled ? 'Report paused' : 'Report resumed');
		} catch {
			toast.error('Failed to update report');
		}
	};

	const handleClone = async () => {
		if (!report.websiteId) {
			toast.error('Cannot clone report without website ID');
			return;
		}

		try {
			await cloneReportMutation.mutateAsync({
				id: report.id,
				websiteId: report.websiteId,
			});
			toast.success('Report cloned successfully');
		} catch {
			toast.error('Failed to clone report');
		}
	};

	const getScheduleText = () => {
		if (!report.scheduleType) {
			return 'Manual only';
		}

		const time = report.scheduleTime || '09:00:00';
		const [hours, minutes] = time.split(':');
		const formattedTime = `${Number.parseInt(hours, 10)}:${minutes}`;
		const timezone = report.timezone ? ` ${report.timezone}` : '';

		const getDayText = () => {
			if (
				report.scheduleType === 'weekly' &&
				report.scheduleDay !== null &&
				report.scheduleDay !== undefined
			) {
				const days = [
					'Sunday',
					'Monday',
					'Tuesday',
					'Wednesday',
					'Thursday',
					'Friday',
					'Saturday',
				];
				return days[report.scheduleDay] || 'Sunday';
			}
			if (
				report.scheduleType === 'monthly' &&
				report.scheduleDay !== null &&
				report.scheduleDay !== undefined
			) {
				return `${report.scheduleDay}${getOrdinalSuffix(report.scheduleDay)}`;
			}
			return '';
		};

		const dayText = getDayText();
		const dayPrefix = dayText ? `${dayText} ` : '';

		switch (report.scheduleType) {
			case 'daily':
				return `Daily at ${formattedTime}${timezone}`;
			case 'weekly':
				return `${dayPrefix}at ${formattedTime}${timezone}`;
			case 'monthly':
				return `${dayPrefix}at ${formattedTime}${timezone}`;
			case 'quarterly':
				return `Quarterly at ${formattedTime}${timezone}`;
			default:
				return 'Manual only';
		}
	};

	const getOrdinalSuffix = (day: number) => {
		if (day >= 11 && day <= 13) {
			return 'th';
		}
		switch (day % 10) {
			case 1:
				return 'st';
			case 2:
				return 'nd';
			case 3:
				return 'rd';
			default:
				return 'th';
		}
	};

	const getStatusBadge = () => {
		if (!report.scheduleType) {
			return (
				<Badge
					className="border-blue-200 bg-blue-50 text-blue-700"
					variant="outline"
				>
					Manual
				</Badge>
			);
		}

		// Check if report is overdue
		const isOverdue =
			report.nextScheduledAt &&
			new Date(report.nextScheduledAt).getTime() < Date.now();

		if (!report.enabled) {
			return (
				<Badge
					className="border-orange-200 bg-orange-50 text-orange-700"
					variant="outline"
				>
					Paused
				</Badge>
			);
		}

		if (isOverdue) {
			return (
				<Badge
					className="border-red-200 bg-red-50 text-red-700"
					variant="outline"
				>
					<WarningIcon className="mr-1 h-3 w-3" size={12} />
					Overdue
				</Badge>
			);
		}

		return (
			<Badge
				className="border-green-200 bg-green-50 text-green-700"
				variant="outline"
			>
				Active
			</Badge>
		);
	};

	return (
		<Card className="rounded-lg border-border/50 transition-all duration-200 hover:border-border hover:shadow-sm">
			<CardHeader className="pb-4">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0 flex-1 space-y-2">
						<div className="flex items-center gap-3">
							<h3 className="truncate font-semibold text-foreground">
								{report.name}
							</h3>
							{getStatusBadge()}
						</div>
						{report.description && (
							<p className="line-clamp-2 text-muted-foreground text-sm">
								{report.description}
							</p>
						)}
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="h-8 w-8 shrink-0 rounded-lg p-0 transition-all duration-200 hover:scale-105"
								size="sm"
								variant="ghost"
							>
								<DotsThreeIcon className="h-4 w-4" size={16} weight="duotone" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40 rounded-lg">
							<DropdownMenuItem
								className="gap-2"
								onClick={() => setIsEditDialogOpen(true)}
							>
								<PencilIcon className="h-4 w-4" size={16} weight="duotone" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem
								className="gap-2"
								disabled={cloneReportMutation.isPending}
								onClick={handleClone}
							>
								<CopyIcon className="h-4 w-4" size={16} weight="duotone" />
								{cloneReportMutation.isPending ? 'Cloning...' : 'Clone'}
							</DropdownMenuItem>
							<DropdownMenuItem
								className="gap-2"
								onClick={() => toast.info('Send now functionality coming soon')}
							>
								<EnvelopeIcon className="h-4 w-4" size={16} weight="duotone" />
								Send Now
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="gap-2"
								disabled={toggleReportMutation.isPending}
								onClick={handleToggle}
							>
								{report.enabled ? (
									<>
										<StopIcon className="h-4 w-4" size={16} weight="fill" />
										{toggleReportMutation.isPending ? 'Pausing...' : 'Pause'}
									</>
								) : (
									<>
										<PlayIcon className="h-4 w-4" size={16} weight="fill" />
										{toggleReportMutation.isPending ? 'Resuming...' : 'Resume'}
									</>
								)}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="gap-2 text-destructive focus:text-destructive"
								onClick={() => setIsDeleteDialogOpen(true)}
							>
								<TrashIcon className="h-4 w-4" size={16} weight="duotone" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>

			<CardContent className="space-y-4 pt-0">
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div className="space-y-2">
						<div className="flex items-center gap-1.5 text-muted-foreground text-sm">
							<CalendarIcon
								className="h-4 w-4 shrink-0"
								size={16}
								weight="duotone"
							/>
							<span className="font-medium">{getScheduleText()}</span>
						</div>

						{report.scheduleType && report.nextScheduledAt && (
							<div className="flex items-center gap-1.5 text-muted-foreground text-sm">
								<ClockIcon
									className="h-4 w-4 shrink-0"
									size={16}
									weight="duotone"
								/>
								<span>
									Next run: {formatNextRunTime(report.nextScheduledAt)}
								</span>
							</div>
						)}
					</div>

					<div className="space-y-2">
						{report.lastSentAt && (
							<div className="flex items-center gap-1.5 text-muted-foreground text-sm">
								<ClockIcon
									className="h-4 w-4 shrink-0"
									size={16}
									weight="duotone"
								/>
								<span>Last sent: {formatRelativeTime(report.lastSentAt)}</span>
							</div>
						)}

						{Array.isArray(report.recipients) &&
							report.recipients.length > 0 && (
								<div className="flex items-center gap-1.5 text-muted-foreground text-sm">
									<EnvelopeIcon
										className="h-4 w-4 shrink-0"
										size={16}
										weight="duotone"
									/>
									<span>
										{report.recipients.length} recipient
										{report.recipients.length !== 1 ? 's' : ''}
									</span>
								</div>
							)}
					</div>
				</div>

				{Array.isArray(report.sections) && report.sections.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{report.sections
							.slice(0, 4)
							.map((section: { title: string }, index) => (
								<Badge
									className="rounded bg-muted/50 font-normal text-muted-foreground text-xs transition-colors duration-200 hover:bg-muted/70"
									key={`section-${report.id}-${section.title}-${index}`}
									variant="secondary"
								>
									{section.title}
								</Badge>
							))}
						{report.sections.length > 4 && (
							<Badge
								className="rounded bg-primary/10 font-normal text-primary text-xs"
								variant="secondary"
							>
								+{report.sections.length - 4} more
							</Badge>
						)}
					</div>
				)}
			</CardContent>

			<ReportDialog
				mode="edit"
				onOpenChange={setIsEditDialogOpen}
				open={isEditDialogOpen}
				report={report}
				websiteId={report.websiteId || ''}
			/>

			<DeleteReportDialog
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				report={{
					id: report.id,
					name: report.name,
					enabled: report.enabled,
					scheduleType: report.scheduleType,
				}}
			/>
		</Card>
	);
}

function ReportsListSkeleton() {
	return (
		<div className="space-y-4">
			{Array.from({ length: 3 }, (_, i) => (
				<Card
					className="rounded-lg border-border/50"
					key={`skeleton-report-${i.toString()}`}
				>
					<CardHeader className="pb-4">
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1 space-y-2">
								<div className="flex items-center gap-3">
									<Skeleton className="h-5 w-48 rounded" />
									<Skeleton className="h-5 w-16 rounded-full" />
								</div>
								<Skeleton className="h-4 w-64 rounded" />
							</div>
							<Skeleton className="h-8 w-8 rounded-lg" />
						</div>
					</CardHeader>
					<CardContent className="space-y-4 pt-0">
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<Skeleton className="h-4 w-32 rounded" />
								<Skeleton className="h-4 w-28 rounded" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-36 rounded" />
								<Skeleton className="h-4 w-24 rounded" />
							</div>
						</div>
						<div className="flex gap-1.5">
							<Skeleton className="h-5 w-20 rounded" />
							<Skeleton className="h-5 w-24 rounded" />
							<Skeleton className="h-5 w-16 rounded" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
