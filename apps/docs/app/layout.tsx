import './global.css';
import { Databuddy } from '@databuddy/sdk';
import { RootProvider } from 'fumadocs-ui/provider';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Manrope } from 'next/font/google';
import Head from 'next/head';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { SITE_URL } from './util/constants';

const geist = Geist({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	variable: '--font-geist',
});

const geistMono = Geist_Mono({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	variable: '--font-geist-mono',
});

const manrope = Manrope({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	variable: '--font-manrope',
});

export const metadata: Metadata = {
	title:
		'Privacy-first web analytics (Google Analytics alternative) — 3 KB, GDPR-compliant | Databuddy',
	description:
		'Experience powerful, privacy-first analytics that matches Google Analytics feature-for-feature without compromising user data. Zero cookies required, 100% data ownership, and AI-powered insights to help your business grow while staying compliant.',
	authors: [{ name: 'Databuddy Team' }],
	creator: 'Databuddy',
	publisher: 'Databuddy',
	metadataBase: new URL(SITE_URL),
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: SITE_URL,
		title:
			'Privacy-first web analytics (Google Analytics alternative) — 3 KB, GDPR-compliant | Databuddy',
		description:
			'Experience powerful, privacy-first analytics that matches Google Analytics feature-for-feature without compromising user data. Zero cookies required, 100% data ownership, and AI-powered insights to help your business grow while staying compliant.',
		siteName: 'Databuddy',
	},
	twitter: {
		card: 'summary_large_image',
		title:
			'Privacy-first web analytics (Google Analytics alternative) — 3 KB, GDPR-compliant | Databuddy',
		description:
			'Experience powerful, privacy-first analytics that matches Google Analytics feature-for-feature without compromising user data. Zero cookies required, 100% data ownership, and AI-powered insights to help your business grow while staying compliant.',
		images: ['/og-image.png'],
		creator: '@databuddyps',
		site: '@databuddyps',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	alternates: {
		canonical: SITE_URL,
	},
	pinterest: {
		richPin: false,
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: 'white' },
		{ media: '(prefers-color-scheme: dark)', color: '#0f172a' },
	],
	width: 'device-width',
	initialScale: 1,
	userScalable: true,
};

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html
			className={`${manrope.variable} ${geist.className} ${geistMono.variable} `}
			lang="en"
			suppressHydrationWarning
		>
			<Script
				async
				data-client-id="OXmNQsViBT-FOS_wZCTHc"
				data-track-attributes={true}
				data-track-errors={true}
				data-track-outgoing-links={true}
				data-track-web-vitals={true}
				src="https://cdn.databuddy.cc/databuddy.js"
				strategy="afterInteractive"
			/>
			<Databuddy clientId="OXmNQsViBT-FOS_wZCTHc" />
			<Head>
				<link href="https://icons.duckduckgo.com" rel="preconnect" />
				<link href="https://icons.duckduckgo.com" rel="dns-prefetch" />
			</Head>
			<body>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<RootProvider>
						<main>{children}</main>
						<Toaster
							closeButton
							duration={1500}
							position="top-center"
							richColors
						/>
					</RootProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
