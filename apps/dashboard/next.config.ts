import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	experimental: {
		viewTransition: true,
		optimizePackageImports: ['@phosphor-icons/react'],
		clientSegmentCache: true,
		reactCompiler: true,
		useCache: true,
		staleTimes: {
			dynamic: 30,
			static: 180,
		},
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		domains: [
			'cdn.databuddy.cc',
			'localhost',
			'icons.duckduckgo.com',
			'flagcdn.com',
		],
	},

	output: 'standalone',
	transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core', '@databuddy/ai'],
};

export function headers() {
	return [
		{
			source: '/((?!demo).*)',
			headers: [
				{
					key: 'Strict-Transport-Security',
					value: 'max-age=31536000; includeSubDomains; preload',
				},
				{
					key: 'X-Content-Type-Options',
					value: 'nosniff',
				},
				{
					key: 'Referrer-Policy',
					value: 'strict-origin-when-cross-origin',
				},
				{
					key: 'Permissions-Policy',
					value: 'camera=(), microphone=(), geolocation=()',
				},
				{
					key: 'X-Frame-Options',
					value: 'DENY',
				},
				{
					key: 'Content-Security-Policy',
					value: "frame-ancestors 'none'",
				},
			],
		},
	];
}

export default nextConfig;
