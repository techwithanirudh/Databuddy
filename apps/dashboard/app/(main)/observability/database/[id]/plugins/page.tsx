'use client';

import {
	ArrowClockwiseIcon,
	CheckIcon,
	ClockIcon,
	DatabaseIcon,
	MagnifyingGlassIcon,
	PlusIcon,
	TrashIcon,
	WarningCircleIcon,
	WarningIcon,
} from '@phosphor-icons/react';
import { use, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { trpc } from '@/lib/trpc';

interface ExtensionsPageProps {
	params: Promise<{ id: string }>;
}

const COMMON_EXTENSIONS = [
	{
		name: 'pg_stat_statements',
		description: 'Track execution statistics of SQL statements',
		category: 'Monitoring',
		useCase: 'Query performance analysis and optimization',
		needsRestart: true,
		stateful: true,
	},
	{
		name: 'uuid-ossp',
		description: 'Generate universally unique identifiers (UUIDs)',
		category: 'Utilities',
		useCase: 'Generate UUIDs for primary keys',
		needsRestart: false,
		stateful: false,
	},
	{
		name: 'pg_trgm',
		description: 'Text similarity using trigram matching',
		category: 'Search',
		useCase: 'Fuzzy text search and similarity queries',
		needsRestart: false,
		stateful: false,
	},
	{
		name: 'pgcrypto',
		description: 'Cryptographic functions and hashing',
		category: 'Security',
		useCase: 'Password hashing and data encryption',
		needsRestart: false,
		stateful: false,
	},
	{
		name: 'hstore',
		description: 'Key-value pairs storage type',
		category: 'Data Types',
		useCase: 'Store flexible key-value data structures',
		needsRestart: false,
		stateful: false,
	},
];

function LoadingState() {
	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-5 w-96" />
			</div>
			<Skeleton className="h-10 w-80" />
			<Skeleton className="h-10 w-full" />
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div className="space-y-3 rounded-lg border p-4" key={i.toString()}>
						<div className="flex items-center justify-between">
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-6 w-20 rounded-full" />
						</div>
						<Skeleton className="h-4 w-full" />
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-8 w-20" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function ErrorState({ error }: { error: string }) {
	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<DatabaseIcon
						className="h-6 w-6 text-muted-foreground"
						weight="duotone"
					/>
					<h1 className="font-bold text-2xl">PostgreSQL Extensions</h1>
				</div>
			</div>
			<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
				<p className="font-medium text-destructive">
					Failed to load extensions
				</p>
				<p className="mt-1 text-muted-foreground text-sm">{error}</p>
			</div>
		</div>
	);
}

function SafetyWarnings({
	warnings,
	suggestedAction,
}: {
	warnings: string[];
	suggestedAction: string;
}) {
	if (warnings.length === 0) {
		return null;
	}

	return (
		<Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
			<WarningIcon className="h-4 w-4 text-amber-600" />
			<AlertTitle className="text-amber-800 dark:text-amber-200">
				Safety Considerations
			</AlertTitle>
			<AlertDescription className="space-y-2">
				<div className="text-amber-700 text-sm dark:text-amber-300">
					{warnings.map((warning, i) => (
						<div key={i.toString()}>• {warning}</div>
					))}
				</div>
				{suggestedAction === 'reset' && (
					<div className="font-medium text-amber-600 text-sm dark:text-amber-400">
						💡 Consider using "Reset Stats" instead of removal to preserve
						configuration
					</div>
				)}
				{suggestedAction === 'manual_review' && (
					<div className="font-medium text-amber-600 text-sm dark:text-amber-400">
						⚠️ Manual review recommended due to complex dependencies
					</div>
				)}
			</AlertDescription>
		</Alert>
	);
}

// biome-ignore lint: Complex UI component with multiple interactions
export default function ExtensionsPage({ params }: ExtensionsPageProps) {
	const [search, setSearch] = useState('');
	const [installDialog, setInstallDialog] = useState(false);
	const [removeDialog, setRemoveDialog] = useState<string | null>(null);
	const [safetyDialog, setSafetyDialog] = useState<string | null>(null);
	const [selectedExtension, setSelectedExtension] = useState('');
	const [installSchema, setInstallSchema] = useState('public');
	const [forceCascade, setForceCascade] = useState(false);

	const resolvedParams = use(params);
	const connectionId = resolvedParams.id;

	const {
		data: extensions,
		isLoading: extensionsLoading,
		error: extensionsError,
		refetch: refetchExtensions,
	} = trpc.dbConnections.getExtensions.useQuery({ id: connectionId });

	const {
		data: availableExtensions,
		isLoading: availableLoading,
		error: availableError,
	} = trpc.dbConnections.getAvailableExtensions.useQuery({ id: connectionId });

	const { data: safetyCheck, isLoading: safetyLoading } =
		trpc.dbConnections.checkExtensionSafety.useQuery(
			{ id: connectionId, extensionName: safetyDialog || '' },
			{ enabled: !!safetyDialog }
		);

	const installMutation = trpc.dbConnections.installExtension.useMutation({
		onSuccess: () => {
			refetchExtensions();
			setInstallDialog(false);
			setSelectedExtension('');
		},
	});

	const removeMutation = trpc.dbConnections.dropExtension.useMutation({
		onSuccess: () => {
			refetchExtensions();
			setRemoveDialog(null);
			setForceCascade(false);
		},
	});

	const updateMutation = trpc.dbConnections.updateExtension.useMutation({
		onSuccess: () => {
			refetchExtensions();
		},
	});

	const resetMutation = trpc.dbConnections.resetExtensionStats.useMutation({
		onSuccess: () => {
			refetchExtensions();
		},
	});

	const filteredInstalled =
		extensions?.filter(
			(ext) =>
				ext.name.toLowerCase().includes(search.toLowerCase()) ||
				ext.description.toLowerCase().includes(search.toLowerCase())
		) || [];

	const filteredAvailable =
		availableExtensions?.filter(
			(ext) =>
				ext.name.toLowerCase().includes(search.toLowerCase()) ||
				ext.description.toLowerCase().includes(search.toLowerCase())
		) || [];

	const handleInstall = () => {
		if (!selectedExtension) {
			return;
		}
		installMutation.mutate({
			id: connectionId,
			extensionName: selectedExtension,
			schema: installSchema || undefined,
			force: false,
		});
	};

	const handleRemove = (extensionName: string, cascade = false) => {
		removeMutation.mutate({
			id: connectionId,
			extensionName,
			cascade,
		});
	};

	const handleUpdate = (extensionName: string) => {
		updateMutation.mutate({
			id: connectionId,
			extensionName,
		});
	};

	const handleReset = (extensionName: string) => {
		resetMutation.mutate({
			id: connectionId,
			extensionName,
		});
	};

	if (extensionsError || availableError) {
		return (
			<ErrorState
				error={
					extensionsError?.message || availableError?.message || 'Unknown error'
				}
			/>
		);
	}

	if (extensionsLoading || availableLoading) {
		return <LoadingState />;
	}

	const updatesAvailable =
		extensions?.filter((ext) => ext.needsUpdate).length || 0;
	const statefulExtensions =
		extensions?.filter((ext) => ext.hasStatefulData).length || 0;
	const restartRequired =
		extensions?.filter((ext) => ext.requiresRestart).length || 0;

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<DatabaseIcon
						className="h-6 w-6 text-muted-foreground"
						weight="duotone"
					/>
					<h1 className="font-bold text-2xl">PostgreSQL Extensions</h1>
				</div>
				<p className="text-muted-foreground text-sm">
					Manage database extensions with production-safe operations and
					dependency tracking
				</p>
			</div>

			{/* Enhanced Stats Overview */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<CheckIcon className="h-5 w-5 text-green-600" weight="bold" />
							<div>
								<p className="font-medium text-2xl">
									{extensions?.length || 0}
								</p>
								<p className="text-muted-foreground text-sm">Installed</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<PlusIcon className="h-5 w-5 text-blue-600" weight="bold" />
							<div>
								<p className="font-medium text-2xl">
									{availableExtensions?.length || 0}
								</p>
								<p className="text-muted-foreground text-sm">Available</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<ArrowClockwiseIcon
								className="h-5 w-5 text-amber-600"
								weight="bold"
							/>
							<div>
								<p className="font-medium text-2xl">{updatesAvailable}</p>
								<p className="text-muted-foreground text-sm">Updates</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<WarningCircleIcon
								className="h-5 w-5 text-red-600"
								weight="bold"
							/>
							<div>
								<p className="font-medium text-2xl">{restartRequired}</p>
								<p className="text-muted-foreground text-sm">Need Restart</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* System Notices */}
			{(statefulExtensions > 0 || restartRequired > 0) && (
				<Alert>
					<DatabaseIcon className="h-4 w-4" />
					<AlertTitle>System Configuration</AlertTitle>
					<AlertDescription className="space-y-1">
						{statefulExtensions > 0 && (
							<div>
								📊 {statefulExtensions} extensions contain performance
								statistics
							</div>
						)}
						{restartRequired > 0 && (
							<div>
								🔄 {restartRequired} extensions require shared_preload_libraries
								configuration
							</div>
						)}
					</AlertDescription>
				</Alert>
			)}

			{/* Search and Actions */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="relative max-w-md flex-1">
					<MagnifyingGlassIcon
						className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground"
						weight="duotone"
					/>
					<Input
						className="pl-10"
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search extensions..."
						value={search}
					/>
				</div>

				<Dialog onOpenChange={setInstallDialog} open={installDialog}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="mr-2 h-4 w-4" weight="bold" />
							Install Extension
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Install Extension</DialogTitle>
							<DialogDescription>
								Select an extension to install. Safety checks will be performed
								automatically.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor="extension-select">Extension</Label>
								<Select
									onValueChange={setSelectedExtension}
									value={selectedExtension}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select an extension" />
									</SelectTrigger>
									<SelectContent>
										{availableExtensions?.map((ext) => (
											<SelectItem key={ext.name} value={ext.name}>
												<div className="flex items-center gap-2">
													<div className="flex flex-col">
														<span className="font-medium">{ext.name}</span>
														<span className="max-w-xs truncate text-muted-foreground text-sm">
															{ext.description}
														</span>
													</div>
													{ext.requiresRestart && (
														<Badge className="text-xs" variant="outline">
															Restart
														</Badge>
													)}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="schema-input">Schema (optional)</Label>
								<Input
									id="schema-input"
									onChange={(e) => setInstallSchema(e.target.value)}
									placeholder="public"
									value={installSchema}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								onClick={() => {
									setInstallDialog(false);
									setSelectedExtension('');
								}}
								variant="outline"
							>
								Cancel
							</Button>
							<Button
								disabled={!selectedExtension || installMutation.isPending}
								onClick={handleInstall}
							>
								{installMutation.isPending ? 'Installing...' : 'Install'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Recommended Extensions */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PlusIcon className="h-5 w-5" weight="duotone" />
						Recommended Extensions
					</CardTitle>
					<CardDescription>
						Popular PostgreSQL extensions with safety information
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{COMMON_EXTENSIONS.map((ext) => {
							const isInstalled = extensions?.some((e) => e.name === ext.name);
							const isAvailable = availableExtensions?.some(
								(a) => a.name === ext.name
							);
							const needsUpdate = extensions?.find(
								(e) => e.name === ext.name
							)?.needsUpdate;

							return (
								<div className="space-y-2 rounded-lg border p-3" key={ext.name}>
									<div className="flex items-center justify-between">
										<h4 className="font-medium text-sm">{ext.name}</h4>
										<div className="flex gap-1">
											{isInstalled ? (
												<Badge className="text-xs" variant="secondary">
													Installed
												</Badge>
											) : isAvailable ? (
												<Badge className="text-xs" variant="outline">
													Available
												</Badge>
											) : (
												<Badge className="text-xs" variant="destructive">
													N/A
												</Badge>
											)}
											{needsUpdate && (
												<Badge className="text-xs" variant="default">
													Update
												</Badge>
											)}
										</div>
									</div>
									<p className="text-muted-foreground text-xs">
										{ext.description}
									</p>
									<p className="text-muted-foreground text-xs italic">
										{ext.useCase}
									</p>
									<div className="flex flex-wrap gap-1">
										{ext.stateful && (
											<Badge className="text-xs" variant="outline">
												Stateful
											</Badge>
										)}
										{ext.needsRestart && (
											<Badge className="text-xs" variant="outline">
												Restart
											</Badge>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* Extensions Tabs */}
			<Tabs className="w-full" defaultValue="installed">
				<TabsList>
					<TabsTrigger value="installed">
						Installed ({extensions?.length || 0})
					</TabsTrigger>
					<TabsTrigger value="available">
						Available ({availableExtensions?.length || 0})
					</TabsTrigger>
				</TabsList>

				<TabsContent className="space-y-4" value="installed">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredInstalled.map((ext) => (
							<div
								className="space-y-3 rounded-lg border bg-card p-4"
								key={ext.name}
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<h3 className="font-semibold">{ext.name}</h3>
										{ext.needsUpdate && (
											<Badge className="text-xs" variant="default">
												<ArrowClockwiseIcon className="mr-1 h-3 w-3" />
												Update
											</Badge>
										)}
									</div>
									<Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
										<CheckIcon className="mr-1 h-3 w-3" weight="bold" />
										Installed
									</Badge>
								</div>

								<p className="text-muted-foreground text-sm">
									{ext.description}
								</p>

								<div className="flex flex-wrap gap-1">
									<span className="text-muted-foreground text-xs">
										v{ext.version}
									</span>
									{ext.availableVersion &&
										ext.availableVersion !== ext.version && (
											<span className="text-blue-600 text-xs">
												→ v{ext.availableVersion}
											</span>
										)}
									{ext.schema && (
										<Badge className="text-xs" variant="outline">
											{ext.schema}
										</Badge>
									)}
									{ext.hasStatefulData && (
										<Badge className="text-xs" variant="outline">
											<DatabaseIcon className="mr-1 h-3 w-3" />
											Stateful
										</Badge>
									)}
									{ext.requiresRestart && (
										<Badge className="text-xs" variant="outline">
											<WarningCircleIcon className="mr-1 h-3 w-3" />
											Restart
										</Badge>
									)}
								</div>

								<div className="flex items-center justify-between gap-2">
									<div className="flex gap-2">
										{ext.needsUpdate && (
											<Button
												disabled={updateMutation.isPending}
												onClick={() => handleUpdate(ext.name)}
												size="sm"
												variant="default"
											>
												<ArrowClockwiseIcon className="mr-1 h-3 w-3" />
												Update
											</Button>
										)}
										{ext.hasStatefulData && (
											<Button
												disabled={resetMutation.isPending}
												onClick={() => handleReset(ext.name)}
												size="sm"
												variant="outline"
											>
												<ClockIcon className="mr-1 h-3 w-3" />
												Reset
											</Button>
										)}
									</div>
									<div className="flex gap-2">
										<Button
											onClick={() => setSafetyDialog(ext.name)}
											size="sm"
											variant="outline"
										>
											Info
										</Button>
										<Button
											onClick={() => setRemoveDialog(ext.name)}
											size="sm"
											variant="destructive"
										>
											<TrashIcon className="mr-1 h-3 w-3" weight="bold" />
											Remove
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>

					{filteredInstalled.length === 0 && (
						<div className="py-12 text-center">
							<DatabaseIcon
								className="mx-auto mb-3 h-12 w-12 text-muted-foreground"
								weight="duotone"
							/>
							<p className="text-muted-foreground">
								No installed extensions found
							</p>
						</div>
					)}
				</TabsContent>

				<TabsContent className="space-y-4" value="available">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredAvailable.map((ext) => (
							<div
								className="space-y-3 rounded-lg border bg-card p-4"
								key={ext.name}
							>
								<div className="flex items-center justify-between">
									<h3 className="font-semibold">{ext.name}</h3>
									<Badge variant="outline">
										<PlusIcon className="mr-1 h-3 w-3" weight="bold" />
										Available
									</Badge>
								</div>

								<p className="text-muted-foreground text-sm">
									{ext.description}
								</p>

								<div className="flex flex-wrap gap-1">
									<span className="text-muted-foreground text-xs">
										v{ext.defaultVersion}
									</span>
									<Badge className="text-xs" variant="outline">
										{ext.category}
									</Badge>
									{ext.requiresRestart && (
										<Badge className="text-amber-600 text-xs" variant="outline">
											<WarningCircleIcon className="mr-1 h-3 w-3" />
											Restart
										</Badge>
									)}
								</div>

								<div className="flex items-center justify-between">
									<div />
									<Button
										onClick={() => {
											setSelectedExtension(ext.name);
											setInstallDialog(true);
										}}
										size="sm"
									>
										<PlusIcon className="mr-1 h-3 w-3" weight="bold" />
										Install
									</Button>
								</div>
							</div>
						))}
					</div>

					{filteredAvailable.length === 0 && (
						<div className="py-12 text-center">
							<CheckIcon
								className="mx-auto mb-3 h-12 w-12 text-muted-foreground"
								weight="duotone"
							/>
							<p className="text-muted-foreground">
								No available extensions found
							</p>
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Safety Dialog */}
			<Dialog
				onOpenChange={(open) => !open && setSafetyDialog(null)}
				open={!!safetyDialog}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<DatabaseIcon className="h-5 w-5" weight="duotone" />
							Extension Safety Information: {safetyDialog}
						</DialogTitle>
						<DialogDescription>
							Comprehensive safety analysis and recommended actions
						</DialogDescription>
					</DialogHeader>

					{safetyLoading ? (
						<div className="space-y-4">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-20 w-full" />
						</div>
					) : (
						safetyCheck && (
							<div className="space-y-4">
								<SafetyWarnings
									suggestedAction={safetyCheck.suggestedAction}
									warnings={safetyCheck.warnings}
								/>

								{safetyCheck.dependencies.length > 0 && (
									<div>
										<h4 className="mb-2 font-semibold">
											Dependent Objects ({safetyCheck.dependencies.length})
										</h4>
										<div className="max-h-32 space-y-1 overflow-y-auto">
											{safetyCheck.dependencies.slice(0, 10).map((dep, i) => (
												<div
													className="flex items-center gap-2 text-sm"
													key={i.toString()}
												>
													<Badge className="text-xs" variant="secondary">
														{dep.type}
													</Badge>
													<span className="text-muted-foreground">
														{dep.schema}.{dep.dependentObject}
													</span>
												</div>
											))}
										</div>
									</div>
								)}

								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="font-medium">Safe to Drop: </span>
										{safetyCheck.canSafelyDrop ? 'Yes' : 'No'}
									</div>
									<div>
										<span className="font-medium">Safe to Update: </span>
										{safetyCheck.canSafelyUpdate ? 'Yes' : 'No'}
									</div>
									<div>
										<span className="font-medium">Stateful Data: </span>
										{safetyCheck.hasStatefulData ? 'Yes' : 'No'}
									</div>
									<div>
										<span className="font-medium">Requires Restart: </span>
										{safetyCheck.requiresRestart ? 'Yes' : 'No'}
									</div>
								</div>
							</div>
						)
					)}

					<DialogFooter>
						<Button onClick={() => setSafetyDialog(null)} variant="outline">
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Remove Dialog */}
			<Dialog
				onOpenChange={(open) => !open && setRemoveDialog(null)}
				open={!!removeDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<WarningIcon className="h-5 w-5 text-amber-500" weight="bold" />
							Remove Extension
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to remove the{' '}
							<strong>{removeDialog}</strong> extension? This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="flex items-center space-x-2">
							<input
								checked={forceCascade}
								id="cascade"
								onChange={(e) => setForceCascade(e.target.checked)}
								type="checkbox"
							/>
							<label className="text-sm" htmlFor="cascade">
								Force removal (CASCADE) - Remove dependent objects
							</label>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => setRemoveDialog(null)} variant="outline">
							Cancel
						</Button>
						<Button
							disabled={removeMutation.isPending}
							onClick={() =>
								removeDialog && handleRemove(removeDialog, forceCascade)
							}
							variant="destructive"
						>
							{removeMutation.isPending ? 'Removing...' : 'Remove'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Admin Access Notice */}
			{(installMutation.error ||
				removeMutation.error ||
				updateMutation.error ||
				resetMutation.error) && (
				<Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
					<CardContent className="pt-6">
						<div className="flex items-start gap-3">
							<WarningIcon
								className="mt-0.5 h-5 w-5 text-amber-600"
								weight="bold"
							/>
							<div>
								<h4 className="font-semibold text-amber-800 dark:text-amber-200">
									Admin Database Access Required
								</h4>
								<p className="mt-1 text-amber-700 text-sm dark:text-amber-300">
									{installMutation.error?.message ||
										removeMutation.error?.message ||
										updateMutation.error?.message ||
										resetMutation.error?.message}
								</p>
								<div className="mt-3 space-y-2 text-amber-600 text-sm dark:text-amber-400">
									<p className="font-medium">
										Migration-safe alternatives with admin access:
									</p>
									<div className="space-y-1 pl-4">
										<div>
											• Use{' '}
											<code className="rounded bg-amber-100 px-1 dark:bg-amber-900/20">
												ALTER EXTENSION UPDATE
											</code>{' '}
											instead of drop/recreate
										</div>
										<div>
											• Use{' '}
											<code className="rounded bg-amber-100 px-1 dark:bg-amber-900/20">
												pg_stat_statements_reset()
											</code>{' '}
											for stats reset
										</div>
										<div>• Check dependencies before dropping with CASCADE</div>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
