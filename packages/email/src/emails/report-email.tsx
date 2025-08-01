import { Button, Heading, Section, Text } from '@react-email/components';
import { EmailLayout } from './email-layout';

interface ReportData {
	id: string;
	success: boolean;
	data: unknown[];
	meta?: unknown;
	error?: string;
}

interface ReportEmailProps {
	reportName: string;
	websiteName?: string;
	reportData: ReportData[];
	executedAt: string;
	dashboardUrl?: string;
}

export const ReportEmail = ({
	reportName,
	websiteName,
	reportData,
	executedAt,
	dashboardUrl,
}: ReportEmailProps) => {
	const successfulQueries = reportData.filter((result) => result.success);
	const failedQueries = reportData.filter((result) => !result.success);

	return (
		<EmailLayout preview={`Your ${reportName} report is ready`}>
			<Heading className="font-bold text-foreground text-xl">
				{reportName} Report
			</Heading>

			{websiteName && (
				<Text className="mb-4 text-muted-foreground">
					Website: {websiteName}
				</Text>
			)}

			<Text className="mb-6 text-muted-foreground">
				Generated on{' '}
				{new Date(executedAt).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
				})}
			</Text>

			{successfulQueries.length > 0 && (
				<Section className="mb-6">
					<Heading className="mb-4 font-semibold text-foreground text-lg">
						Report Summary
					</Heading>

					{successfulQueries.map((result, index) => (
						<Section
							className="mb-4 rounded border border-border p-4"
							key={result.id}
						>
							<Text className="mb-2 font-medium text-foreground">
								Query {index + 1}
							</Text>
							<Text className="text-muted-foreground">
								{result.data.length} records found
							</Text>
							{result.meta && (
								<Text className="text-muted-foreground text-sm">
									{JSON.stringify(result.meta)}
								</Text>
							)}
						</Section>
					))}
				</Section>
			)}

			{failedQueries.length > 0 && (
				<Section className="mb-6">
					<Heading className="mb-4 font-semibold text-lg text-red-400">
						Failed Queries ({failedQueries.length})
					</Heading>

					{failedQueries.map((result, index) => (
						<Section
							className="mb-4 rounded border border-red-400/20 bg-red-400/10 p-4"
							key={result.id}
						>
							<Text className="mb-2 font-medium text-red-400">
								Query {index + 1}
							</Text>
							<Text className="text-red-300 text-sm">{result.error}</Text>
						</Section>
					))}
				</Section>
			)}

			{dashboardUrl && (
				<Section className="text-center">
					<Button
						className="rounded bg-brand px-6 py-3 font-medium text-white"
						href={dashboardUrl}
					>
						View Full Report
					</Button>
				</Section>
			)}
		</EmailLayout>
	);
};
