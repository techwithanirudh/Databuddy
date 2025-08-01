import { trpc } from '@/lib/trpc';

interface UseReportsOptions {
	websiteId?: string;
	organizationId?: string;
}

export function useReports(options: UseReportsOptions = {}) {
	return trpc.reports.list.useQuery(options);
}

export function useReport(id: string) {
	return trpc.reports.getById.useQuery({ id });
}

export function useCreateReport() {
	const utils = trpc.useUtils();

	return trpc.reports.create.useMutation({
		onSuccess: () => {
			utils.reports.list.invalidate();
		},
	});
}

export function useUpdateReport() {
	const utils = trpc.useUtils();

	return trpc.reports.update.useMutation({
		onSuccess: (data) => {
			utils.reports.list.invalidate();
			utils.reports.getById.invalidate({ id: data.id });
		},
	});
}

export function useDeleteReport() {
	const utils = trpc.useUtils();

	return trpc.reports.delete.useMutation({
		onSuccess: () => {
			utils.reports.list.invalidate();
		},
	});
}

export function useToggleReport() {
	const utils = trpc.useUtils();

	return trpc.reports.toggle.useMutation({
		onSuccess: (data) => {
			utils.reports.list.invalidate();
			utils.reports.getById.invalidate({ id: data.id });
		},
	});
}

export function useCloneReport() {
	const utils = trpc.useUtils();

	return trpc.reports.clone.useMutation({
		onSuccess: () => {
			utils.reports.list.invalidate();
		},
	});
}

export function useReportExecutions(
	options: { templateId?: string; websiteId?: string; limit?: number } = {}
) {
	return trpc.reports.executions.useQuery(options);
}

export function useMarketplaceReports(
	options: {
		type?: 'executive' | 'detailed' | 'performance' | 'traffic' | 'custom';
		limit?: number;
	} = {}
) {
	return trpc.reports.marketplace.useQuery(options);
}
