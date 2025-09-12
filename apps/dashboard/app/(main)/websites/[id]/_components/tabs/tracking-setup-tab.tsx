'use client';

import {
	ActivityIcon,
	ArrowClockwiseIcon,
	BookOpenIcon,
	ChatCircleIcon,
	CheckIcon,
	ClipboardIcon,
	CodeIcon,
	FileCodeIcon,
	WarningCircleIcon,
} from '@phosphor-icons/react';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import {
	toggleTrackingOptionAtom,
	trackingOptionsAtom,
} from '@/stores/jotai/filterAtoms';
import {
	generateNpmCode,
	generateNpmComponentCode,
	generateScriptTag,
	generateVercelNpmCode,
} from '../utils/code-generators';

import type { TrackingOptions, WebsiteDataTabProps } from '../utils/types';

const CodeBlock = ({
	code,
	description,
	onCopy,
	copied,
}: {
	code: string;
	description?: string;
	onCopy: () => void;
	copied: boolean;
}) => {
	const [highlightedCode, setHighlightedCode] = useState<string>('');

	const getLanguage = useCallback((codeContent: string) => {
		if (
			codeContent.includes('npm install') ||
			codeContent.includes('yarn add') ||
			codeContent.includes('pnpm add') ||
			codeContent.includes('bun add')
		) {
			return 'bash';
		}
		if (codeContent.includes('<script')) {
			return 'html';
		}
		if (codeContent.includes('import') && codeContent.includes('from')) {
			return 'jsx';
		}
		return 'javascript';
	}, []);

	useEffect(() => {
		const highlightCode = async () => {
			try {
				const isDarkMode = document.documentElement.classList.contains('dark');
				const theme = isDarkMode ? 'github-dark' : 'github-light';

				const html = await codeToHtml(code, {
					lang: getLanguage(code),
					theme,
				});
				setHighlightedCode(html);
			} catch (error) {
				console.error('Error highlighting code:', error);
				setHighlightedCode(`<pre><code>${code}</code></pre>`);
			}
		};

		highlightCode();

		// Listen for theme changes
		const observer = new MutationObserver(() => {
			highlightCode();
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		});

		return () => observer.disconnect();
	}, [code, getLanguage]);

	return (
		<div className="space-y-2">
			{description && (
				<p className="text-muted-foreground text-sm">{description}</p>
			)}
			<div className="relative">
				<div
					className="[&_pre]:!bg-transparent [&_code]:!bg-transparent [&_*]:!font-mono overflow-hidden rounded border bg-slate-50 p-6 text-sm leading-relaxed dark:bg-slate-900"
					dangerouslySetInnerHTML={{ __html: highlightedCode }}
					style={{
						fontSize: '14px',
						lineHeight: '1.6',
						fontFamily:
							'var(--font-geist-mono), ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
					}}
				/>
				<Button
					className="absolute top-2 right-2 h-6 w-6 rounded border-0 shadow-none transition-colors duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80"
					onClick={onCopy}
					size="icon"
					variant="ghost"
				>
					{copied ? (
						<CheckIcon className="h-3.5 w-3.5 text-green-500" weight="bold" />
					) : (
						<ClipboardIcon
							className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
							weight="regular"
						/>
					)}
				</Button>
			</div>
		</div>
	);
};

export function WebsiteTrackingSetupTab({ websiteId }: WebsiteDataTabProps) {
	const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
	const [installMethod, setInstallMethod] = useState<'script' | 'npm'>(
		'script'
	);
	const [trackingOptions] = useAtom(trackingOptionsAtom);

	const trackingCode = generateScriptTag(websiteId, trackingOptions);
	const npmCode = generateNpmCode(websiteId, trackingOptions);

	const handleCopyCode = (code: string, blockId: string, message: string) => {
		navigator.clipboard.writeText(code);
		setCopiedBlockId(blockId);
		toast.success(message);
		setTimeout(() => setCopiedBlockId(null), 2000);
	};

	const [, toggleTrackingOptionAction] = useAtom(toggleTrackingOptionAtom);
	const handleToggleOption = (option: keyof TrackingOptions) => {
		toggleTrackingOptionAction(option);
	};

	const utils = trpc.useUtils();
	const { data: trackingSetupData, refetch: refetchTrackingSetup } =
		trpc.websites.isTrackingSetup.useQuery(
			{ websiteId },
			{ enabled: !!websiteId }
		);

	const handleRefresh = async () => {
		toast.success('Checking tracking status...');

		try {
			await utils.websites.isTrackingSetup.invalidate({ websiteId });
			const result = await refetchTrackingSetup();

			if (result.data?.tracking_setup) {
				const integrationType = result.data.integration_type;
				if (integrationType === 'vercel') {
					toast.success('Vercel integration active! Data is being collected.');
				} else {
					toast.success('Tracking setup correctly! Data is being collected.');
				}
			} else {
				const integrationType = result.data?.integration_type;
				if (integrationType === 'vercel') {
					toast.error(
						'Vercel integration detected but no events yet. Make sure your site is deployed and receiving traffic.'
					);
				} else {
					toast.error(
						'Tracking not found. Please verify the script installation.'
					);
				}
			}
		} catch (error) {
			console.error('Failed to check tracking status:', error);
			toast.error('Failed to check tracking status. Please try again.');
		}
	};

	return (
		<div className="space-y-4">
			{/* Quick Setup Alert */}
			{trackingSetupData?.tracking_setup ? (
				<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
					<div className="flex items-center justify-between p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
								<CheckIcon
									className="h-4 w-4 text-green-600 dark:text-green-400"
									weight="duotone"
								/>
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="font-medium text-green-800 text-sm dark:text-green-200">
									{trackingSetupData.integration_type === 'vercel'
										? 'Vercel Integration Active'
										: 'Tracking Active'}
								</span>
								<span className="font-normal text-green-600 text-xs dark:text-green-400">
									{trackingSetupData.integration_type === 'vercel'
										? 'Data is being collected via Vercel integration'
										: 'Data is being collected successfully'}
								</span>
							</div>
						</div>
						<Button
							aria-label="Refresh tracking status"
							className="h-7 w-7 rounded-md border-0 shadow-none transition-all duration-200 hover:bg-green-100/50 hover:shadow-sm dark:hover:bg-green-900/50"
							onClick={handleRefresh}
							size="icon"
							variant="ghost"
						>
							<ArrowClockwiseIcon
								className="h-3.5 w-3.5 text-green-600/70 hover:text-green-600 dark:text-green-400/70 dark:hover:text-green-400"
								weight="fill"
							/>
						</Button>
					</div>
				</Card>
			) : (
				<Card
					className={`${
						trackingSetupData?.integration_type === 'vercel'
							? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
							: 'border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10'
					}`}
				>
					<div className="flex items-center justify-between p-4">
						<div className="flex items-center gap-3">
							<div
								className={`flex h-8 w-8 items-center justify-center rounded-lg ${
									trackingSetupData?.integration_type === 'vercel'
										? 'bg-amber-100 dark:bg-amber-900'
										: 'bg-primary/15 dark:bg-primary/20'
								}`}
							>
								<WarningCircleIcon
									className={`h-4 w-4 ${
										trackingSetupData?.integration_type === 'vercel'
											? 'text-amber-600 dark:text-amber-400'
											: 'text-primary'
									}`}
									weight="duotone"
								/>
							</div>
							<div className="flex flex-col gap-0.5">
								<span
									className={`font-medium text-sm ${
										trackingSetupData?.integration_type === 'vercel'
											? 'text-amber-800 dark:text-amber-200'
											: 'text-foreground'
									}`}
								>
									{trackingSetupData?.integration_type === 'vercel'
										? 'Vercel Integration Ready'
										: 'Tracking Not Setup'}
								</span>
								<span
									className={`font-normal text-xs ${
										trackingSetupData?.integration_type === 'vercel'
											? 'text-amber-600 dark:text-amber-400'
											: 'text-muted-foreground'
									}`}
								>
									{trackingSetupData?.integration_type === 'vercel'
										? 'Environment variables configured, waiting for traffic'
										: 'Install the tracking script to start collecting data'}
								</span>
							</div>
						</div>
						<Button
							aria-label="Refresh tracking status"
							className={`h-7 w-7 rounded-md border-0 shadow-none transition-all duration-200 hover:shadow-sm ${
								trackingSetupData?.integration_type === 'vercel'
									? 'hover:bg-amber-100/50 dark:hover:bg-amber-900/50'
									: 'hover:bg-background/20'
							}`}
							onClick={handleRefresh}
							size="icon"
							variant="ghost"
						>
							<ArrowClockwiseIcon
								className={`h-3.5 w-3.5 ${
									trackingSetupData?.integration_type === 'vercel'
										? 'text-amber-600/70 hover:text-amber-600 dark:text-amber-400/70 dark:hover:text-amber-400'
										: 'text-primary/70 hover:text-primary'
								}`}
								weight="fill"
							/>
						</Button>
					</div>
				</Card>
			)}

			{/* Installation Instructions */}
			{trackingSetupData?.integration_type === 'vercel' ? (
				<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-200">
							<CodeIcon className="h-4 w-4" weight="duotone" />
							Vercel Integration Setup
						</CardTitle>
						<CardDescription className="text-blue-600 text-xs dark:text-blue-400">
							Your website is integrated with Vercel - no manual setup required!
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-2">
						<div className="space-y-4">
							<div className="rounded-lg border border-blue-200 bg-blue-100/50 p-4 dark:border-blue-700 dark:bg-blue-900/30">
								<div className="flex items-start gap-3">
									<CheckIcon
										className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400"
										weight="duotone"
									/>
									<div className="space-y-2">
										<p className="font-medium text-blue-800 text-sm dark:text-blue-200">
											Automatic SDK Detection
										</p>
										<p className="text-blue-700 text-xs leading-relaxed dark:text-blue-300">
											The Databuddy SDK will automatically detect the{' '}
											<code className="rounded bg-blue-200 px-1 py-0.5 font-mono text-xs dark:bg-blue-800">
												NEXT_PUBLIC_DATABUDDY_CLIENT_ID
											</code>{' '}
											environment variable set by your Vercel integration.
										</p>
									</div>
								</div>
							</div>

							<div className="space-y-3">
								<h4 className="font-medium text-blue-800 text-sm dark:text-blue-200">
									Simply add the SDK to your app:
								</h4>
								<CodeBlock
									code={generateVercelNpmCode(trackingOptions)}
									copied={copiedBlockId === 'vercel-setup'}
									description="Add this to your root layout or _app.js file:"
									onCopy={() =>
										handleCopyCode(
											generateVercelNpmCode(trackingOptions),
											'vercel-setup',
											'Vercel setup code copied to clipboard!'
										)
									}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<CodeIcon className="h-4 w-4" weight="duotone" />
							Installation
						</CardTitle>
						<CardDescription className="text-xs">
							Choose your preferred installation method
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-2">
						<Tabs
							onValueChange={(value) =>
								setInstallMethod(value as 'script' | 'npm')
							}
							value={installMethod}
						>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger className="flex items-center gap-2" value="script">
									<FileCodeIcon className="h-4 w-4" weight="duotone" />
									HTML Script Tag
								</TabsTrigger>
								<TabsTrigger className="flex items-center gap-2" value="npm">
									<CodeIcon className="h-4 w-4" weight="duotone" />
									NPM Package
								</TabsTrigger>
							</TabsList>

							<TabsContent className="space-y-4" value="script">
								<CodeBlock
									code={trackingCode}
									copied={copiedBlockId === 'script-tag'}
									description="Add this script to the <head> section of your HTML:"
									onCopy={() =>
										handleCopyCode(
											trackingCode,
											'script-tag',
											'Script tag copied to clipboard!'
										)
									}
								/>
								<p className="text-muted-foreground text-xs">
									Data will appear within a few minutes after installation.
								</p>
							</TabsContent>

							<TabsContent className="space-y-4" value="npm">
								<div className="space-y-2">
									<p className="mb-3 text-muted-foreground text-xs">
										Install the DataBuddy package using your preferred package
										manager:
									</p>

									<Tabs className="w-full" defaultValue="npm">
										<TabsList className="mb-2 grid h-8 grid-cols-4">
											<TabsTrigger className="text-xs" value="npm">
												npm
											</TabsTrigger>
											<TabsTrigger className="text-xs" value="yarn">
												yarn
											</TabsTrigger>
											<TabsTrigger className="text-xs" value="pnpm">
												pnpm
											</TabsTrigger>
											<TabsTrigger className="text-xs" value="bun">
												bun
											</TabsTrigger>
										</TabsList>

										<TabsContent className="mt-0" value="npm">
											<CodeBlock
												code="npm install @databuddy/sdk"
												copied={copiedBlockId === 'npm-install'}
												description=""
												onCopy={() =>
													handleCopyCode(
														'npm install @databuddy/sdk',
														'npm-install',
														'Command copied to clipboard!'
													)
												}
											/>
										</TabsContent>

										<TabsContent className="mt-0" value="yarn">
											<CodeBlock
												code="yarn add @databuddy/sdk"
												copied={copiedBlockId === 'yarn-install'}
												description=""
												onCopy={() =>
													handleCopyCode(
														'yarn add @databuddy/sdk',
														'yarn-install',
														'Command copied to clipboard!'
													)
												}
											/>
										</TabsContent>

										<TabsContent className="mt-0" value="pnpm">
											<CodeBlock
												code="pnpm add @databuddy/sdk"
												copied={copiedBlockId === 'pnpm-install'}
												description=""
												onCopy={() =>
													handleCopyCode(
														'pnpm add @databuddy/sdk',
														'pnpm-install',
														'Command copied to clipboard!'
													)
												}
											/>
										</TabsContent>

										<TabsContent className="mt-0" value="bun">
											<CodeBlock
												code="bun add @databuddy/sdk"
												copied={copiedBlockId === 'bun-install'}
												description=""
												onCopy={() =>
													handleCopyCode(
														'bun add @databuddy/sdk',
														'bun-install',
														'Command copied to clipboard!'
													)
												}
											/>
										</TabsContent>
									</Tabs>

									<CodeBlock
										code={npmCode}
										copied={copiedBlockId === 'tracking-code'}
										description="Then initialize the tracker in your code:"
										onCopy={() =>
											handleCopyCode(
												generateNpmComponentCode(websiteId, trackingOptions),
												'tracking-code',
												'Tracking code copied to clipboard!'
											)
										}
									/>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			)}

			{/* Tracking Configuration */}
			<Card>
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg">
						<ActivityIcon className="h-5 w-5" weight="duotone" />
						Configuration
					</CardTitle>
					<CardDescription>
						Customize tracking options (optional)
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{/* Core Tracking */}
						<div className="space-y-3">
							<h4 className="font-medium text-sm">Core Tracking</h4>
							<div className="space-y-2">
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="disabled">
											Enable Tracking
										</Label>
										<div className="text-muted-foreground text-xs">
											Master switch for all tracking
										</div>
									</div>
									<Switch
										checked={!trackingOptions.disabled}
										id="disabled"
										onCheckedChange={() => handleToggleOption('disabled')}
									/>
								</div>
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackScreenViews">
											Page Views
										</Label>
										<div className="text-muted-foreground text-xs">
											Track page visits
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackScreenViews}
										id="trackScreenViews"
										onCheckedChange={() =>
											handleToggleOption('trackScreenViews')
										}
									/>
								</div>
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackHashChanges">
											Hash Changes
										</Label>
										<div className="text-muted-foreground text-xs">
											Track URL hash navigation
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackHashChanges}
										id="trackHashChanges"
										onCheckedChange={() =>
											handleToggleOption('trackHashChanges')
										}
									/>
								</div>
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackSessions">
											Sessions
										</Label>
										<div className="text-muted-foreground text-xs">
											Track session duration
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackSessions}
										id="trackSessions"
										onCheckedChange={() => handleToggleOption('trackSessions')}
									/>
								</div>
							</div>
						</div>

						{/* Interaction Tracking */}
						<div className="space-y-3">
							<h4 className="font-medium text-sm">Interaction Tracking</h4>
							<div className="space-y-2">
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackInteractions">
											Interactions
										</Label>
										<div className="text-muted-foreground text-xs">
											Track clicks and forms
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackInteractions}
										id="trackInteractions"
										onCheckedChange={() =>
											handleToggleOption('trackInteractions')
										}
									/>
								</div>
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackAttributes">
											Data Attributes
										</Label>
										<div className="text-muted-foreground text-xs">
											Track data-* attributes
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackAttributes}
										id="trackAttributes"
										onCheckedChange={() =>
											handleToggleOption('trackAttributes')
										}
									/>
								</div>
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackOutgoingLinks">
											Outbound Links
										</Label>
										<div className="text-muted-foreground text-xs">
											Track external link clicks
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackOutgoingLinks}
										id="trackOutgoingLinks"
										onCheckedChange={() =>
											handleToggleOption('trackOutgoingLinks')
										}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{/* Engagement Tracking */}
						<div className="space-y-3">
							<h4 className="font-medium text-sm">Engagement Tracking</h4>
							<div className="space-y-2">
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackEngagement">
											Engagement
										</Label>
										<div className="text-muted-foreground text-xs">
											Track user engagement
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackEngagement}
										id="trackEngagement"
										onCheckedChange={() =>
											handleToggleOption('trackEngagement')
										}
									/>
								</div>
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackScrollDepth">
											Scroll Depth
										</Label>
										<div className="text-muted-foreground text-xs">
											Track scroll percentage
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackScrollDepth}
										id="trackScrollDepth"
										onCheckedChange={() =>
											handleToggleOption('trackScrollDepth')
										}
									/>
								</div>
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackExitIntent">
											Exit Intent
										</Label>
										<div className="text-muted-foreground text-xs">
											Track exit behavior
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackExitIntent}
										id="trackExitIntent"
										onCheckedChange={() =>
											handleToggleOption('trackExitIntent')
										}
									/>
								</div>
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackBounceRate">
											Bounce Rate
										</Label>
										<div className="text-muted-foreground text-xs">
											Track bounce detection
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackBounceRate}
										id="trackBounceRate"
										onCheckedChange={() =>
											handleToggleOption('trackBounceRate')
										}
									/>
								</div>
							</div>
						</div>

						{/* Performance Tracking */}
						<div className="space-y-3">
							<h4 className="font-medium text-sm">Performance Tracking</h4>
							<div className="space-y-2">
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackPerformance">
											Load Times
										</Label>
										<div className="text-muted-foreground text-xs">
											Track page performance
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackPerformance}
										id="trackPerformance"
										onCheckedChange={() =>
											handleToggleOption('trackPerformance')
										}
									/>
								</div>
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackWebVitals">
											Web Vitals
										</Label>
										<div className="text-muted-foreground text-xs">
											Track Core Web Vitals
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackWebVitals}
										id="trackWebVitals"
										onCheckedChange={() => handleToggleOption('trackWebVitals')}
									/>
								</div>
								<div className="flex items-center justify-between py-2">
									<div>
										<Label className="text-sm" htmlFor="trackErrors">
											Errors
										</Label>
										<div className="text-muted-foreground text-xs">
											Track JS errors
										</div>
									</div>
									<Switch
										checked={trackingOptions.trackErrors}
										id="trackErrors"
										onCheckedChange={() => handleToggleOption('trackErrors')}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Optimization */}
					<div className="space-y-3">
						<h4 className="font-medium text-sm">Optimization</h4>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							<div className="flex items-center justify-between py-2">
								<div>
									<Label className="text-sm" htmlFor="enableBatching">
										Enable Batching
									</Label>
									<div className="text-muted-foreground text-xs">
										Batch requests for efficiency
									</div>
								</div>
								<Switch
									checked={trackingOptions.enableBatching}
									id="enableBatching"
									onCheckedChange={() => handleToggleOption('enableBatching')}
								/>
							</div>
							<div className="flex items-center justify-between py-2">
								<div>
									<Label className="text-sm" htmlFor="enableRetries">
										Enable Retries
									</Label>
									<div className="text-muted-foreground text-xs">
										Retry failed requests
									</div>
								</div>
								<Switch
									checked={trackingOptions.enableRetries}
									id="enableRetries"
									onCheckedChange={() => handleToggleOption('enableRetries')}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Help Links */}
			<div className="grid grid-cols-2 gap-3">
				<Button asChild size="sm" variant="outline">
					<a
						className="flex items-center justify-center gap-2"
						href="https://www.databuddy.cc/docs"
						rel="noopener noreferrer"
						target="_blank"
					>
						<BookOpenIcon className="h-4 w-4" weight="duotone" />
						Documentation
					</a>
				</Button>
				<Button asChild size="sm" variant="outline">
					<a
						className="flex items-center justify-center gap-2"
						href="mailto:support@databuddy.cc"
					>
						<ChatCircleIcon className="h-4 w-4" weight="duotone" />
						Get Support
					</a>
				</Button>
			</div>
		</div>
	);
}
