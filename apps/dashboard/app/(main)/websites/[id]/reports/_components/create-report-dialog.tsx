'use client';

import {
	ClockIcon,
	EnvelopeIcon,
	PlusIcon,
	TrashIcon,
	XIcon,
} from '@phosphor-icons/react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReport, useUpdateReport } from '../_hooks/use-reports';

interface ReportSection {
	id: string;
	title: string;
	queryType: string;
	chartType?: 'line' | 'bar' | 'pie' | 'metric';
	timeRange: {
		start: string;
		end: string;
	};
	includeComparison: boolean;
}

interface Recipient {
	email: string;
	name: string;
}

const availableMetrics = [
	{ value: 'visitors', label: 'Unique Visitors', chartType: 'line' },
	{ value: 'pageviews', label: 'Page Views', chartType: 'line' },
	{ value: 'sessions', label: 'Sessions', chartType: 'line' },
	{ value: 'bounce_rate', label: 'Bounce Rate', chartType: 'metric' },
	{ value: 'session_duration', label: 'Session Duration', chartType: 'metric' },
	{ value: 'pages', label: 'Top Pages', chartType: 'bar' },
	{ value: 'sources', label: 'Traffic Sources', chartType: 'pie' },
	{ value: 'geographic', label: 'Geographic Data', chartType: 'bar' },
	{ value: 'devices', label: 'Device Types', chartType: 'pie' },
	{ value: 'browsers', label: 'Browsers', chartType: 'pie' },
	{ value: 'operating_systems', label: 'Operating Systems', chartType: 'pie' },
	{ value: 'page_load_time', label: 'Page Load Time', chartType: 'line' },
	{ value: 'core_web_vitals', label: 'Core Web Vitals', chartType: 'metric' },
	{ value: 'error_rate', label: 'Error Rate', chartType: 'line' },
];

interface ReportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	websiteId: string;
	mode: 'create' | 'edit';
	report?: {
		id: string;
		name: string;
		description: string | null;
		type: 'executive' | 'detailed' | 'performance' | 'traffic' | 'custom';
		scheduleType?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | null;
		scheduleTime?: string | null;
		scheduleDay?: number | null;
		recipients?: unknown;
		sections?: unknown;
	};
}

export function ReportDialog({
	open,
	onOpenChange,
	websiteId,
	mode,
	report,
}: ReportDialogProps) {
	const isEdit = mode === 'edit';

	// Shared state
	const [formData, setFormData] = useState({
		name: isEdit && report ? report.name : '',
		description: isEdit && report ? report.description || '' : '',
		type: isEdit && report ? report.type : 'executive',
		scheduleType: (isEdit && report && report.scheduleType
			? report.scheduleType
			: 'manual') as 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly',
		scheduleDay:
			isEdit && report && typeof report.scheduleDay === 'number'
				? report.scheduleDay
				: 1,
		scheduleTime:
			isEdit && report && report.scheduleTime
				? report.scheduleTime.substring(0, 5)
				: '09:00',
		recipients:
			isEdit && report && Array.isArray(report.recipients)
				? (report.recipients as Recipient[])
				: [],
		sections:
			isEdit && report && Array.isArray(report.sections)
				? (report.sections as ReportSection[])
				: [],
	});
	const [newRecipient, setNewRecipient] = useState({ email: '', name: '' });
	const [selectedMetric, setSelectedMetric] = useState('');

	// Mutations
	const createReportMutation = useCreateReport();
	const updateReportMutation = useUpdateReport();

	// Handlers
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		// Validation (shared)
		if (!formData.name.trim()) {
			toast.error('Report name is required');
			return;
		}
		if (formData.sections.length === 0) {
			toast.error('At least one section is required');
			return;
		}
		if (
			formData.scheduleType !== 'manual' &&
			formData.recipients.length === 0
		) {
			toast.error('At least one recipient is required for scheduled reports');
			return;
		}
		try {
			if (isEdit && report) {
				await updateReportMutation.mutateAsync({
					id: report.id,
					name: formData.name.trim(),
					description: formData.description.trim() || undefined,
					type: formData.type,
					scheduleType:
						formData.scheduleType === 'manual'
							? undefined
							: formData.scheduleType,
					scheduleDay:
						formData.scheduleType === 'monthly'
							? formData.scheduleDay
							: undefined,
					scheduleTime:
						formData.scheduleType !== 'manual'
							? `${formData.scheduleTime}:00`
							: undefined,
					recipients:
						formData.recipients.length > 0 ? formData.recipients : undefined,
					sections: formData.sections,
				});
				toast.success('Report updated successfully');
			} else {
				await createReportMutation.mutateAsync({
					websiteId,
					name: formData.name,
					description: formData.description || undefined,
					type: formData.type,
					sections: formData.sections,
					scheduleType:
						formData.scheduleType !== 'manual'
							? formData.scheduleType
							: undefined,
					scheduleDay: formData.scheduleDay,
					scheduleTime: `${formData.scheduleTime}:00`,
					recipients:
						formData.recipients.length > 0 ? formData.recipients : undefined,
				});
				toast.success('Report created successfully!');
				resetForm();
			}
			onOpenChange(false);
		} catch (error) {
			console.error('Failed to save report:', error);
			toast.error('Failed to save report. Please try again.');
		}
	};

	const resetForm = useCallback(() => {
		setFormData({
			name: '',
			description: '',
			type: 'executive',
			scheduleType: 'manual',
			scheduleDay: 1,
			scheduleTime: '09:00',
			recipients: [],
			sections: [],
		});
		setNewRecipient({ email: '', name: '' });
		setSelectedMetric('');
	}, []);

	const addRecipient = () => {
		if (!(newRecipient.email && newRecipient.name)) {
			toast.error('Both email and name are required');
			return;
		}

		if (formData.recipients.some((r) => r.email === newRecipient.email)) {
			toast.error('Email already added');
			return;
		}

		setFormData((prev) => ({
			...prev,
			recipients: [...prev.recipients, newRecipient],
		}));
		setNewRecipient({ email: '', name: '' });
	};

	const removeRecipient = (email: string) => {
		setFormData((prev) => ({
			...prev,
			recipients: prev.recipients.filter((r) => r.email !== email),
		}));
	};

	const addSection = () => {
		if (!selectedMetric) {
			toast.error('Please select a metric');
			return;
		}

		const metric = availableMetrics.find((m) => m.value === selectedMetric);
		if (!metric) {
			return;
		}

		const newSection: ReportSection = {
			id: crypto.randomUUID(),
			title: metric.label,
			queryType: metric.value,
			chartType: metric.chartType as 'line' | 'bar' | 'pie' | 'metric',
			timeRange: {
				start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
				end: new Date().toISOString(),
			},
			includeComparison: true,
		};

		setFormData((prev) => ({
			...prev,
			sections: [...prev.sections, newSection],
		}));
		setSelectedMetric('');
	};

	const removeSection = (id: string) => {
		setFormData((prev) => ({
			...prev,
			sections: prev.sections.filter((s) => s.id !== id),
		}));
	};

	const loadPresetSections = (type: string) => {
		const baseSection = {
			timeRange: {
				start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
				end: new Date().toISOString(),
			},
			includeComparison: true,
		};

		const presets = {
			executive: [
				{
					...baseSection,
					title: 'Visitors Overview',
					queryType: 'visitors',
					chartType: 'line' as const,
				},
				{
					...baseSection,
					title: 'Top Pages',
					queryType: 'pages',
					chartType: 'bar' as const,
				},
				{
					...baseSection,
					title: 'Traffic Sources',
					queryType: 'sources',
					chartType: 'pie' as const,
				},
			],
			detailed: [
				{
					...baseSection,
					title: 'Visitors Overview',
					queryType: 'visitors',
					chartType: 'line' as const,
				},
				{
					...baseSection,
					title: 'Page Views',
					queryType: 'pageviews',
					chartType: 'line' as const,
				},
				{
					...baseSection,
					title: 'Bounce Rate',
					queryType: 'bounce_rate',
					chartType: 'metric' as const,
				},
				{
					...baseSection,
					title: 'Session Duration',
					queryType: 'session_duration',
					chartType: 'metric' as const,
				},
				{
					...baseSection,
					title: 'Top Pages',
					queryType: 'pages',
					chartType: 'bar' as const,
				},
				{
					...baseSection,
					title: 'Traffic Sources',
					queryType: 'sources',
					chartType: 'pie' as const,
				},
			],
			performance: [
				{
					...baseSection,
					title: 'Page Load Time',
					queryType: 'page_load_time',
					chartType: 'line' as const,
				},
				{
					...baseSection,
					title: 'Core Web Vitals',
					queryType: 'core_web_vitals',
					chartType: 'metric' as const,
				},
				{
					...baseSection,
					title: 'Error Rate',
					queryType: 'error_rate',
					chartType: 'line' as const,
				},
			],
			traffic: [
				{
					...baseSection,
					title: 'Traffic Sources',
					queryType: 'sources',
					chartType: 'pie' as const,
				},
				{
					...baseSection,
					title: 'Geographic Data',
					queryType: 'geographic',
					chartType: 'bar' as const,
				},
				{
					...baseSection,
					title: 'Device Types',
					queryType: 'devices',
					chartType: 'pie' as const,
				},
			],
		};

		const sections = presets[type as keyof typeof presets] || [];
		setFormData((prev) => ({
			...prev,
			sections: sections.map((s) => ({ ...s, id: crypto.randomUUID() })),
		}));
	};

	const reportTypeDescriptions = {
		executive: 'High-level overview with key metrics and trends',
		detailed: 'Comprehensive analysis of all website metrics',
		performance: 'Page speed, Core Web Vitals, and technical metrics',
		traffic: 'Visitor sources, geography, and device analytics',
		custom: 'Build your own report with selected metrics',
	};

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent
				className="w-full overflow-y-auto p-4 sm:w-[60vw] sm:max-w-[1200px]"
				side="right"
			>
				<SheetHeader className="space-y-3 border-border/50 border-b pb-6">
					<div className="flex items-center gap-3">
						<div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
							<EnvelopeIcon
								className="h-6 w-6 text-primary"
								size={16}
								weight="duotone"
							/>
						</div>
						<div>
							<SheetTitle className="font-semibold text-foreground text-xl">
								{isEdit ? 'Edit Automated Report' : 'Create Automated Report'}
							</SheetTitle>
							<SheetDescription className="mt-1 text-muted-foreground">
								Set up a customized analytics report with scheduling and
								recipients
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<form className="space-y-6 pt-6" onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div className="space-y-2">
							<Label
								className="font-medium text-foreground text-sm"
								htmlFor="name"
							>
								Report Name
							</Label>
							<Input
								className="rounded-lg border-border/50 transition-all duration-200 hover:border-border focus:border-primary/50 focus:ring-primary/20"
								id="name"
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, name: e.target.value }))
								}
								placeholder="Weekly Analytics Summary"
								value={formData.name}
							/>
						</div>
						<div className="space-y-2">
							<Label
								className="font-medium text-foreground text-sm"
								htmlFor="type"
							>
								Report Type
							</Label>
							<Select
								onValueChange={(
									value:
										| 'executive'
										| 'detailed'
										| 'performance'
										| 'traffic'
										| 'custom'
								) => {
									setFormData((prev) => ({ ...prev, type: value }));
									loadPresetSections(value);
								}}
								value={formData.type}
							>
								<SelectTrigger className="rounded-lg border-border/50 transition-all duration-200 hover:border-border focus:border-primary/50">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-lg">
									{Object.entries(reportTypeDescriptions).map(
										([key, description]) => (
											<SelectItem key={key} value={key}>
												<div>
													<div className="font-medium capitalize">{key}</div>
													<div className="text-muted-foreground text-xs">
														{description}
													</div>
												</div>
											</SelectItem>
										)
									)}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="space-y-2">
						<Label
							className="font-medium text-foreground text-sm"
							htmlFor="description"
						>
							Description
						</Label>
						<Textarea
							className="rounded-lg border-border/50 transition-all duration-200 hover:border-border focus:border-primary/50 focus:ring-primary/20"
							id="description"
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							placeholder="Brief description of what this report covers..."
							rows={2}
							value={formData.description}
						/>
					</div>

					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<ClockIcon
								className="h-5 w-5 text-primary"
								size={16}
								weight="duotone"
							/>
							<Label className="font-semibold text-base text-foreground">
								Schedule & Delivery
							</Label>
						</div>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label className="font-medium text-foreground text-sm">
									Schedule Type
								</Label>
								<Select
									onValueChange={(
										value:
											| 'manual'
											| 'daily'
											| 'weekly'
											| 'monthly'
											| 'quarterly'
									) =>
										setFormData((prev) => ({ ...prev, scheduleType: value }))
									}
									value={formData.scheduleType}
								>
									<SelectTrigger className="rounded-lg border-border/50 transition-all duration-200 hover:border-border focus:border-primary/50">
										<SelectValue placeholder="Manual only" />
									</SelectTrigger>
									<SelectContent className="rounded-lg">
										<SelectItem value="manual">Manual only</SelectItem>
										<SelectItem value="daily">Daily</SelectItem>
										<SelectItem value="weekly">Weekly</SelectItem>
										<SelectItem value="monthly">Monthly</SelectItem>
										<SelectItem value="quarterly">Quarterly</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{formData.scheduleType !== 'manual' && (
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									{(formData.scheduleType === 'weekly' ||
										formData.scheduleType === 'monthly') && (
										<div className="space-y-2">
											<Label className="font-medium text-foreground text-sm">
												{formData.scheduleType === 'weekly'
													? 'Day of Week'
													: 'Day of Month'}
											</Label>
											<Select
												onValueChange={(value) =>
													setFormData((prev) => ({
														...prev,
														scheduleDay: Number.parseInt(value, 10),
													}))
												}
												value={formData.scheduleDay.toString()}
											>
												<SelectTrigger className="rounded-lg border-border/50 transition-all duration-200 hover:border-border focus:border-primary/50">
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="rounded-lg">
													{formData.scheduleType === 'weekly'
														? [
																'Sunday',
																'Monday',
																'Tuesday',
																'Wednesday',
																'Thursday',
																'Friday',
																'Saturday',
															].map((day) => (
																<SelectItem key={day} value={day}>
																	{day}
																</SelectItem>
															))
														: Array.from({ length: 28 }, (_, i) => i + 1).map(
																(day) => (
																	<SelectItem key={day} value={day.toString()}>
																		{day}
																	</SelectItem>
																)
															)}
												</SelectContent>
											</Select>
										</div>
									)}
									<div className="space-y-2">
										<Label className="font-medium text-foreground text-sm">
											Time
										</Label>
										<Input
											className="rounded-lg border-border/50 transition-all duration-200 hover:border-border focus:border-primary/50 focus:ring-primary/20"
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													scheduleTime: e.target.value,
												}))
											}
											type="time"
											value={formData.scheduleTime}
										/>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<EnvelopeIcon
								className="h-5 w-5 text-primary"
								size={16}
								weight="duotone"
							/>
							<Label className="font-semibold text-base text-foreground">
								Recipients
							</Label>
							<span className="text-muted-foreground text-xs">
								{formData.scheduleType !== 'manual'
									? '(required for scheduled reports)'
									: '(optional)'}
							</span>
						</div>

						<div className="space-y-4">
							<div className="flex gap-3">
								<Input
									className="flex-1 rounded-lg border-border/50 transition-all duration-200 hover:border-border focus:border-primary/50 focus:ring-primary/20"
									onChange={(e) =>
										setNewRecipient((prev) => ({
											...prev,
											email: e.target.value,
										}))
									}
									placeholder="Email address"
									type="email"
									value={newRecipient.email}
								/>
								<Input
									className="flex-1 rounded-lg border-border/50 transition-all duration-200 hover:border-border focus:border-primary/50 focus:ring-primary/20"
									onChange={(e) =>
										setNewRecipient((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									placeholder="Name"
									value={newRecipient.name}
								/>
								<Button
									className="rounded-lg transition-all duration-200 hover:scale-105"
									onClick={addRecipient}
									size="sm"
									type="button"
								>
									<PlusIcon className="h-4 w-4" size={16} />
								</Button>
							</div>

							{formData.recipients.length > 0 && (
								<div className="space-y-3">
									{formData.recipients.map((recipient) => (
										<div
											className="group flex items-center justify-between rounded-lg border bg-muted/30 p-3 transition-all duration-200 hover:bg-muted/40 hover:shadow-sm"
											key={recipient.email}
										>
											<div>
												<div className="font-medium">{recipient.name}</div>
												<div className="text-muted-foreground text-sm">
													{recipient.email}
												</div>
											</div>
											<Button
												className="h-8 w-8 rounded-lg p-0 transition-all duration-200 hover:scale-105 hover:bg-destructive/10 hover:text-destructive"
												onClick={() => removeRecipient(recipient.email)}
												size="sm"
												type="button"
												variant="ghost"
											>
												<XIcon className="h-4 w-4" size={16} />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<EnvelopeIcon
								className="h-5 w-5 text-primary"
								size={16}
								weight="duotone"
							/>
							<Label className="font-semibold text-base text-foreground">
								Report Sections
							</Label>
							<span className="text-muted-foreground text-xs">
								(choose metrics to include)
							</span>
						</div>

						<div className="space-y-4">
							<div className="flex gap-3">
								<Select
									onValueChange={setSelectedMetric}
									value={selectedMetric}
								>
									<SelectTrigger className="flex-1 rounded-lg border-border/50 transition-all duration-200 hover:border-border focus:border-primary/50">
										<SelectValue placeholder="Select a metric to add" />
									</SelectTrigger>
									<SelectContent className="rounded-lg">
										{availableMetrics
											.filter(
												(metric) =>
													!formData.sections.some(
														(s) => s.queryType === metric.value
													)
											)
											.map((metric) => (
												<SelectItem key={metric.value} value={metric.value}>
													{metric.label}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
								<Button
									className="rounded-lg transition-all duration-200 hover:scale-105"
									disabled={!selectedMetric}
									onClick={addSection}
									size="sm"
									type="button"
								>
									<PlusIcon className="h-4 w-4" size={16} />
								</Button>
							</div>

							{formData.sections.length > 0 && (
								<div className="space-y-3">
									{formData.sections.map((section) => (
										<div
											className="group flex items-center justify-between rounded-lg border bg-muted/30 p-3 transition-all duration-200 hover:bg-muted/40 hover:shadow-sm"
											key={section.id}
										>
											<div className="flex items-center gap-3">
												<div className="rounded bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
													{section.chartType}
												</div>
												<div>
													<div className="font-medium">{section.title}</div>
													<div className="text-muted-foreground text-sm">
														{section.includeComparison
															? 'With comparison'
															: 'No comparison'}
													</div>
												</div>
											</div>
											<Button
												className="h-8 w-8 rounded-lg p-0 transition-all duration-200 hover:scale-105 hover:bg-destructive/10 hover:text-destructive"
												onClick={() => removeSection(section.id)}
												size="sm"
												type="button"
												variant="ghost"
											>
												<TrashIcon className="h-4 w-4" size={16} />
											</Button>
										</div>
									))}
								</div>
							)}

							{formData.sections.length === 0 && (
								<div className="rounded-lg border border-primary/30 border-dashed p-8 text-center text-muted-foreground">
									No sections added yet. Select a metric above to get started.
								</div>
							)}
						</div>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-3 border-border/50 border-t pt-6">
						<Button
							className="rounded-lg transition-all duration-200 hover:bg-muted"
							disabled={createReportMutation.isPending}
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="relative rounded-lg bg-gradient-to-r from-primary to-primary/90 shadow-lg transition-all duration-200 hover:from-primary/90 hover:to-primary hover:shadow-xl"
							disabled={
								createReportMutation.isPending ||
								!formData.name.trim() ||
								formData.sections.length === 0
							}
							type="submit"
						>
							{createReportMutation.isPending && (
								<div className="absolute left-3">
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
								</div>
							)}
							<span className={createReportMutation.isPending ? 'ml-6' : ''}>
								{createReportMutation.isPending
									? 'Creating...'
									: 'Create Report'}
							</span>
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}
