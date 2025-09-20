'use client';

import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { LiveUserIndicator } from '@/components/analytics';
import { DateRangePicker } from '@/components/date-range-picker';
import { Button } from '@/components/ui/button';
import { useDateFilters } from '@/hooks/use-date-filters';
import { addDynamicFilterAtom } from '@/stores/jotai/filterAtoms';
import { AddFilterForm } from './utils/add-filters';

interface AnalyticsToolbarProps {
	isRefreshing: boolean;
	onRefresh: () => void;
	websiteId: string;
}

export function AnalyticsToolbar({
	isRefreshing,
	onRefresh,
	websiteId,
}: AnalyticsToolbarProps) {
	const {
		currentDateRange,
		currentGranularity,
		setCurrentGranularityAtomState,
		setDateRangeAction,
	} = useDateFilters();

	const [, addFilter] = useAtom(addDynamicFilterAtom);

	const dayPickerSelectedRange: DayPickerRange | undefined = useMemo(
		() => ({
			from: currentDateRange.startDate,
			to: currentDateRange.endDate,
		}),
		[currentDateRange]
	);

	const quickRanges = useMemo(
		() => [
			{ label: '24h', fullLabel: 'Last 24 hours', hours: 24 },
			{ label: '7d', fullLabel: 'Last 7 days', days: 7 },
			{ label: '30d', fullLabel: 'Last 30 days', days: 30 },
			{ label: '90d', fullLabel: 'Last 90 days', days: 90 },
			{ label: '180d', fullLabel: 'Last 180 days', days: 180 },
			{ label: '365d', fullLabel: 'Last 365 days', days: 365 },
		],
		[]
	);

	const handleQuickRangeSelect = useCallback(
		(range: (typeof quickRanges)[0]) => {
			const now = new Date();
			const start = range.hours
				? dayjs(now).subtract(range.hours, 'hour').toDate()
				: dayjs(now)
						.subtract(range.days || 7, 'day')
						.toDate();
			setDateRangeAction({ startDate: start, endDate: now });
		},
		[setDateRangeAction]
	);

	return (
		<div className="mt-3 flex flex-col gap-2 rounded border bg-card p-3 shadow-sm">
			<div className="flex items-center justify-between gap-3">
				<div className="flex h-8 overflow-hidden rounded border bg-background shadow-sm">
					<Button
						className={`h-8 cursor-pointer touch-manipulation rounded-none px-3 text-sm ${currentGranularity === 'daily' ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground'}`}
						onClick={() => setCurrentGranularityAtomState('daily')}
						size="sm"
						title="View daily aggregated data"
						variant="ghost"
					>
						Daily
					</Button>
					<Button
						className={`h-8 cursor-pointer touch-manipulation rounded-none px-3 text-sm ${currentGranularity === 'hourly' ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground'}`}
						onClick={() => setCurrentGranularityAtomState('hourly')}
						size="sm"
						title="View hourly data (best for 24h periods)"
						variant="ghost"
					>
						Hourly
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<AddFilterForm addFilter={addFilter} buttonText="Filter" />
					<LiveUserIndicator websiteId={websiteId} />
					<Button
						aria-label="Refresh data"
						className="h-8 w-8"
						disabled={isRefreshing}
						onClick={onRefresh}
						size="icon"
						variant="outline"
					>
						<ArrowClockwiseIcon
							aria-hidden="true"
							className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
						/>
					</Button>
				</div>
			</div>

			<div className="flex items-center gap-1 overflow-x-auto rounded border bg-background p-1 shadow-sm">
				{quickRanges.map((range) => {
					const now = new Date();
					const start = range.hours
						? dayjs(now).subtract(range.hours, 'hour').toDate()
						: dayjs(now)
								.subtract(range.days || 7, 'day')
								.toDate();
					const dayPickerCurrentRange = dayPickerSelectedRange;
					const isActive =
						dayPickerCurrentRange?.from &&
						dayPickerCurrentRange?.to &&
						dayjs(dayPickerCurrentRange.from).format('YYYY-MM-DD') ===
							dayjs(start).format('YYYY-MM-DD') &&
						dayjs(dayPickerCurrentRange.to).format('YYYY-MM-DD') ===
							dayjs(now).format('YYYY-MM-DD');

					return (
						<Button
							className={`h-8 cursor-pointer touch-manipulation whitespace-nowrap px-2 font-medium text-xs ${isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
							key={range.label}
							onClick={() => handleQuickRangeSelect(range)}
							size="sm"
							title={range.fullLabel}
							variant={isActive ? 'secondary' : 'ghost'}
						>
							{range.label}
						</Button>
					);
				})}

				<div className="ml-1 border-border/50 border-l pl-2">
					<DateRangePicker
						className="w-auto"
						maxDate={new Date()}
						minDate={new Date(2020, 0, 1)}
						onChange={(range) => {
							if (range?.from && range?.to) {
								setDateRangeAction({
									startDate: range.from,
									endDate: range.to,
								});
							}
						}}
						value={dayPickerSelectedRange}
					/>
				</div>
			</div>
		</div>
	);
}
