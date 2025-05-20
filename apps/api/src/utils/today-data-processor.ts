/**
 * Utilities for merging today's real-time data with historical data
 */
import { formatAvgSessionDuration, getCurrentHourFormatted, isToday } from './analytics-helpers';


interface TodayData {
  pageviews: number;
  visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration?: number;
  [key: string]: any;
}

/**
 * Merge today's data into the summary
 * NOTE: We don't need to add today's data to summary since it's already included
 * We only use this for display purposes
 */
export function mergeTodayDataIntoSummary(
  summaryData: any,
  todayData: TodayData | null
): any {
  if (!todayData) {
    return summaryData;
  }

  // Just return the original summary data - no need to add today's data
  // as it's already included in the summary query
  return {
    ...summaryData,
    // Keep a reference to today's data for UI display
    today: {
      pageviews: todayData.pageviews || 0,
      visitors: todayData.visitors || 0, 
      sessions: todayData.sessions || 0,
      bounce_rate: todayData.bounce_rate || 0,
      bounce_rate_pct: `${Math.round((todayData.bounce_rate || 0) * 10) / 10}%`
    }
  };
}

/**
 * Update events by date to include today's data
 * We need to either replace or add today's entry, but NOT add to existing entry
 */
export function updateEventsWithTodayData(
  eventsByDate: any[],
  todayData: TodayData | null, // This is the daily summary
  granularity: 'hourly' | 'daily' = 'daily'
): any[] {
  // If granularity is hourly, we trust the eventsByDate from the hourly builder.
  // The daily summary (todayData) should not be used to alter granular hourly data.
  if (granularity === 'hourly') {
    // The createEventsByDateBuilder('hourly') should provide a complete
    // and accurate list of hourly data points, including zeros for inactive hours,
    // for the specified date range. We return this list as is, by returning a copy.
    return [...eventsByDate];
  }

  // Daily granularity logic (largely the same as before):
  // Update the single 'today' entry in eventsByDate using the daily todayData.
  if (!todayData) {
    return [...eventsByDate]; // Return copy if no todayData for daily processing
  }

  const updatedEvents = [...eventsByDate];
  const todayDateString = new Date().toISOString().split('T')[0];
  const todayIndex = updatedEvents.findIndex(day => day.date?.substring(0, 10) === todayDateString);

  const dailyStats = {
    date: todayDateString,
    pageviews: todayData.pageviews || 0,
    unique_visitors: todayData.visitors || 0, // todayData.visitors is used for unique_visitors field
    visitors: todayData.visitors || 0,
    sessions: todayData.sessions || 0,
    bounce_rate: todayData.bounce_rate || 0,
    bounce_rate_pct: `${Math.round((todayData.bounce_rate || 0) * 10) / 10}%`,
    avg_session_duration: todayData.avg_session_duration || 0,
    avg_session_duration_formatted: formatAvgSessionDuration(todayData.avg_session_duration || 0)
  };

  if (todayIndex >= 0) {
    updatedEvents[todayIndex] = dailyStats;
  } else {
    // If today's entry doesn't exist in eventsByDate, add it.
    updatedEvents.push(dailyStats);
  }
  return updatedEvents;
}

/**
 * Merge today's data into trend data results
 * We need to replace today's entry, not add to it, for daily.
 * For hourly, we preserve the original hourly trend data.
 */
export function mergeTodayIntoTrends(
  trendData: any[],
  todayData: TodayData | null, // Daily summary
  granularity: 'hourly' | 'daily'
): any[] {
  if (!todayData) {
    // If no todayData, return a copy of the original trendData.
    return trendData.map(entry => ({ ...entry }));
  }

  // const currentHour = getCurrentHourFormatted(); // Not strictly needed with the revised logic

  return trendData.map(entry => {
    const entryDateString = entry.date.toString();
    
    // For daily trends, if the entry is for today, replace its metrics with todayData (daily summary).
    if (granularity === 'daily' && isToday(entryDateString)) {
      return {
        ...entry,
        pageviews: todayData.pageviews || 0,
        unique_visitors: todayData.visitors || 0,
        visitors: todayData.visitors || 0,
        sessions: todayData.sessions || 0,
        bounce_rate: todayData.bounce_rate || 0,
        bounce_rate_pct: `${Math.round((todayData.bounce_rate || 0) * 10) / 10}%`,
        avg_session_duration: todayData.avg_session_duration || 0,
        avg_session_duration_formatted: formatAvgSessionDuration(todayData.avg_session_duration || 0)
      };
    }
    
    // For hourly trends, or for daily trends not matching today,
    // we return a copy of the original entry.
    // The daily `todayData` is not used to modify granular hourly trend data.
    return { ...entry };
  });
}