'use client';

import { EnvelopeIcon } from '@phosphor-icons/react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useWebsite } from '@/hooks/use-websites';
import { WebsitePageHeader } from '../_components/website-page-header';
import { ReportDialog } from './_components/create-report-dialog';
import { ReportsList } from './_components/reports-list';

export default function ReportsPage() {
	const params = useParams();
	const websiteId = params.id as string;
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	const { data: website, isLoading: isWebsiteLoading } = useWebsite(websiteId);

	return (
		<div className="space-y-8 p-3 sm:p-4 lg:p-6">
			<WebsitePageHeader
				createActionLabel="Create Report"
				description="Create and manage automated analytics reports delivered to your inbox"
				icon={<EnvelopeIcon className="h-5 w-5" />}
				isLoading={isWebsiteLoading}
				onCreateAction={() => setIsCreateDialogOpen(true)}
				title="Automated Reports"
				websiteId={websiteId}
				websiteName={website?.name || undefined}
			/>

			<ReportsList
				onCreateReport={() => setIsCreateDialogOpen(true)}
				websiteId={websiteId}
			/>

			<ReportDialog
				mode="create"
				onOpenChange={setIsCreateDialogOpen}
				open={isCreateDialogOpen}
				websiteId={websiteId}
			/>
		</div>
	);
}
