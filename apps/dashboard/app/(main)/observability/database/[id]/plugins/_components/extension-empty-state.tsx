'use client';

import {
	DatabaseIcon,
	MagnifyingGlassIcon,
	PlusIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ExtensionEmptyStateProps {
	type: 'installed' | 'available' | 'search';
	searchTerm?: string;
	onInstallExtension?: () => void;
	onClearSearch?: () => void;
	canManage?: boolean;
}

export function ExtensionEmptyState({
	type,
	searchTerm,
	onInstallExtension,
	onClearSearch,
	canManage = false,
}: ExtensionEmptyStateProps) {
	const getContent = () => {
		switch (type) {
			case 'installed':
				return {
					icon: (
						<DatabaseIcon
							className="h-12 w-12 text-muted-foreground"
							weight="duotone"
						/>
					),
					title: 'No Extensions Installed',
					description:
						'Get started by installing your first PostgreSQL extension to enhance your database capabilities.',
					action:
						canManage && onInstallExtension ? (
							<Button className="gap-2" onClick={onInstallExtension}>
								<PlusIcon className="h-4 w-4" />
								Install Extension
							</Button>
						) : null,
				};
			case 'available':
				return {
					icon: (
						<DatabaseIcon
							className="h-12 w-12 text-muted-foreground"
							weight="duotone"
						/>
					),
					title: 'No Available Extensions',
					description:
						'All available extensions have been installed or there are no extensions available for installation.',
					action: null,
				};
			case 'search':
				return {
					icon: (
						<MagnifyingGlassIcon
							className="h-12 w-12 text-muted-foreground"
							weight="duotone"
						/>
					),
					title: 'No Extensions Found',
					description: searchTerm
						? `No extensions match "${searchTerm}". Try adjusting your search terms.`
						: 'No extensions match your search criteria.',
					action: onClearSearch ? (
						<Button onClick={onClearSearch} variant="outline">
							Clear Search
						</Button>
					) : null,
				};
			default:
				return {
					icon: (
						<DatabaseIcon
							className="h-12 w-12 text-muted-foreground"
							weight="duotone"
						/>
					),
					title: 'No Extensions',
					description: 'No extensions available.',
					action: null,
				};
		}
	};

	const content = getContent();

	return (
		<Card className="rounded border-dashed">
			<CardContent className="flex flex-col items-center justify-center py-16 text-center">
				<div className="mb-4 rounded-full border border-muted bg-muted/20 p-6">
					{content.icon}
				</div>
				<h3 className="mb-2 font-semibold text-lg">{content.title}</h3>
				<p className="mb-6 max-w-md text-muted-foreground text-sm">
					{content.description}
				</p>
				{content.action}
			</CardContent>
		</Card>
	);
}
