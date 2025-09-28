'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SkeletonChart } from './skeleton';

interface CanvasChartProps {
	title: string;
	children: ReactNode;
	legend?: {
		items: Array<{
			label: string;
			type: 'solid' | 'dashed' | 'pattern';
			color?: string;
		}>;
	};
	isLoading?: boolean;
	height?: string | number;
	className?: string;
}

export function CanvasChart({
	title,
	children,
	legend,
	isLoading = false,
	height = '20rem',
	className,
}: CanvasChartProps) {
	if (isLoading) {
		return (
			<div className={cn('mb-6', className)}>
				<SkeletonChart height={height} />
			</div>
		);
	}

	return (
		<div className={cn('mb-6', className)}>
			{/* Chart Header */}
			<div className="mb-4 flex items-center justify-between">
				<h4 className="font-normal font-serif text-[18px] text-foreground">
					{title}
				</h4>
				{legend && (
					<div className="flex items-center gap-4" data-hide-in-pdf="true">
						{legend.items.map((item, index) => {
							const getSquareStyle = () => {
								const baseColor = item.color || '#707070';

								switch (item.type) {
									case 'solid':
										return {
											backgroundColor: item.color || '#000000',
										};
									case 'dashed':
										return {
											backgroundColor: 'transparent',
											border: `1px dashed ${baseColor}`,
										};
									case 'pattern':
										return {
											backgroundColor: 'transparent',
											backgroundImage: `repeating-linear-gradient(45deg, ${baseColor}, ${baseColor} 1px, transparent 1px, transparent 2px)`,
										};
									default:
										return { backgroundColor: baseColor };
								}
							};

							return (
								<div
									className="flex items-center gap-2"
									key={`legend-${item.label}-${index}`}
								>
									<div
										className="h-2 w-2 flex-shrink-0 border-0"
										style={getSquareStyle()}
									/>
									<span className="text-muted-foreground text-[12px] leading-none">
										{item.label}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Chart Content */}
			<div style={{ height }}>{children}</div>
		</div>
	);
}
