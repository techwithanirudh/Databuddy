import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import CustomSidebar from '@/components/custom-sidebar';
import { Navbar } from '@/components/navbar';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<DocsLayout
			tree={source.pageTree}
			{...baseOptions}
			nav={{
				enabled: true,
				component: <Navbar />,
			}}
			sidebar={{
				enabled: true,
				component: <CustomSidebar />,
			}}
		>
			{children}
		</DocsLayout>
	);
}
