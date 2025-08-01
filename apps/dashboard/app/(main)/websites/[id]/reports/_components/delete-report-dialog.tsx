'use client';

import { WarningIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteReport } from '../_hooks/use-reports';

interface DeleteReportDialogProps {
	report: {
		id: string;
		name: string;
		enabled: boolean;
		scheduleType?: string | null;
	} | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeleteReportDialog({
	report,
	open,
	onOpenChange,
}: DeleteReportDialogProps) {
	const deleteReportMutation = useDeleteReport();

	const handleDelete = async () => {
		if (!report) {
			return;
		}

		try {
			await deleteReportMutation.mutateAsync({ id: report.id });
			toast.success('Report deleted successfully');
			onOpenChange(false);
		} catch (error) {
			console.error('Failed to delete report:', error);
			toast.error('Failed to delete report. Please try again.');
		}
	};

	if (!report) {
		return null;
	}

	const isScheduled = report.enabled && report.scheduleType;

	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent className="rounded-lg">
				<AlertDialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
							<WarningIcon
								className="h-5 w-5 text-destructive"
								weight="duotone"
							/>
						</div>
						<div>
							<AlertDialogTitle className="text-left">
								Delete Report
							</AlertDialogTitle>
							<AlertDialogDescription className="text-left">
								Are you sure you want to delete "{report.name}"?
							</AlertDialogDescription>
						</div>
					</div>
				</AlertDialogHeader>

				<div className="space-y-3 py-4">
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
						<div className="space-y-2 text-sm">
							<p className="font-medium">
								This action cannot be undone. You will lose:
							</p>
							<ul className="list-inside list-disc space-y-1 text-amber-700">
								<li>All report configuration and settings</li>
								<li>Historical execution data and logs</li>
								<li>Email recipient lists and preferences</li>
								{isScheduled && (
									<li className="font-medium text-amber-800">
										Scheduled deliveries will stop immediately
									</li>
								)}
							</ul>
						</div>
					</div>

					{isScheduled && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
							<p className="font-medium text-sm">
								⚠️ This report is currently active and scheduled to run{' '}
								{report.scheduleType}. Recipients will no longer receive
								automated reports.
							</p>
						</div>
					)}
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel
						className="rounded-lg"
						disabled={deleteReportMutation.isPending}
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
						disabled={deleteReportMutation.isPending}
						onClick={handleDelete}
					>
						{deleteReportMutation.isPending ? (
							<div className="flex items-center gap-2">
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
								Deleting...
							</div>
						) : (
							'Delete Report'
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
