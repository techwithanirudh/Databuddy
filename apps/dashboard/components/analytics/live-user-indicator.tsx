'use client';

import { useEffect, useRef, useState } from 'react';
import { useRealTimeStats } from '@/hooks/use-dynamic-query';

interface LiveUserIndicatorProps {
	websiteId: string;
}

export function LiveUserIndicator({ websiteId }: LiveUserIndicatorProps) {
	const { activeUsers: count } = useRealTimeStats(websiteId);
	const prevCountRef = useRef(count);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const [change, setChange] = useState<'up' | 'down' | null>(null);

	useEffect(() => {
		const prevCount = prevCountRef.current;

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		if (count > prevCount) {
			setChange('up');
			timeoutRef.current = setTimeout(() => setChange(null), 1000);
		} else if (count < prevCount) {
			setChange('down');
			timeoutRef.current = setTimeout(() => setChange(null), 1000);
		}

		prevCountRef.current = count;
	}, [count]);

	const getChangeColor = () => {
		if (change === 'up') {
			return 'text-green-500';
		}
		if (change === 'down') {
			return 'text-red-500';
		}
		return 'text-foreground';
	};

	return (
		<div className="flex h-8 items-center gap-2 rounded border bg-background px-3 py-2 font-medium text-xs shadow-sm transition-colors hover:bg-accent/50">
			<span className="relative flex h-2 w-2">
				<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
				<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
			</span>
			<span className={getChangeColor()}>
				{count} {count === 1 ? 'user' : 'users'}
			</span>
		</div>
	);
}
