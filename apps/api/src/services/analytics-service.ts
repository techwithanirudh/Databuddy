/**
 * Analytics Service
 * Centralized service for data fetching and processing
 */
import { chQuery } from '@databuddy/db';
import { format } from 'date-fns';
import { parseUserAgent } from '../utils/user-agent';
import { formatTime, formatCleanPath, getDefaultDateRange } from '../utils/analytics-helpers';
import { 
  createSummaryBuilder, 
  createTodayBuilder, 
  createTopPagesBuilder,
  createTopReferrersBuilder,
  createEventsByDateBuilder,
  createScreenResolutionsBuilder,
  createBrowserVersionsBuilder,
  createCountriesBuilder,
  createDeviceTypesBuilder,
  createConnectionTypesBuilder,
  createLanguagesBuilder, 
  createTimezonesBuilder,
  createPerformanceBuilder,
  parseReferrers
} from '../builders/analytics';

export interface AnalyticsQueryParams {
  website_id: string;
  start_date?: string;
  end_date?: string;
  granularity?: 'daily' | 'hourly';
  interval?: 'day' | 'week' | 'month' | 'auto';
  limit?: number;
}

// Interface for referrer data
interface ReferrerData {
  referrer: string;
  visitors: number;
  pageviews: number;
}

/**
 * Fetch summary data with all associated metrics
 */
export async function fetchSummaryData(params: AnalyticsQueryParams) {
  // Set default date range
  const { startDate, endDate } = getDefaultDateRange(params.end_date, params.start_date);
  const today = new Date().toISOString().split('T')[0];
  
  // Prepare all necessary query builders
  const summaryBuilder = createSummaryBuilder(params.website_id, startDate, endDate);
  const todayBuilder = createTodayBuilder(params.website_id);
  const topPagesBuilder = createTopPagesBuilder(params.website_id, startDate, endDate, params.limit || 5);
  const topReferrersBuilder = createTopReferrersBuilder(params.website_id, startDate, endDate, params.limit || 5);
  const eventsByDateBuilder = createEventsByDateBuilder(
    params.website_id, 
    startDate, 
    endDate, 
    params.granularity as 'hourly' | 'daily' || 'daily'
  );
  const todayPagesBuilder = createTopPagesBuilder(params.website_id, today, today, params.limit || 5);
  const todayReferrersBuilder = createTopReferrersBuilder(params.website_id, today, today, params.limit || 5);
  const resolutionsBuilder = createScreenResolutionsBuilder(params.website_id, startDate, endDate, params.limit || 10);
  const browserVersionsBuilder = createBrowserVersionsBuilder(params.website_id, startDate, endDate, params.limit || 10);
  const countriesBuilder = createCountriesBuilder(params.website_id, startDate, endDate, params.limit || 5);
  const deviceTypesBuilder = createDeviceTypesBuilder(params.website_id, startDate, endDate, params.limit || 5);
  const connectionTypesBuilder = createConnectionTypesBuilder(params.website_id, startDate, endDate, params.limit || 5);
  const languagesBuilder = createLanguagesBuilder(params.website_id, startDate, endDate, params.limit || 5);
  const timezonesBuilder = createTimezonesBuilder(params.website_id, startDate, endDate, params.limit || 5);
  const performanceBuilder = createPerformanceBuilder(params.website_id, startDate, endDate);

  // Execute all queries in parallel
  const [
    summaryData, 
    todayData, 
    topPages, 
    topReferrers, 
    eventsByDate, 
    todayTopPages, 
    todayTopReferrers,
    resolutions,
    browserVersions,
    countries,
    deviceTypeResults,
    connectionTypes,
    languages,
    timezones,
    performance
  ] = await Promise.all([
    chQuery(summaryBuilder.getSql()),
    chQuery(todayBuilder.getSql()),
    chQuery(topPagesBuilder.getSql()),
    chQuery(topReferrersBuilder.getSql()),
    chQuery(eventsByDateBuilder.getSql()),
    chQuery(todayPagesBuilder.getSql()),
    chQuery(todayReferrersBuilder.getSql()),
    chQuery(resolutionsBuilder.getSql()),
    chQuery(browserVersionsBuilder.getSql()),
    chQuery(countriesBuilder.getSql()),
    chQuery(deviceTypesBuilder.getSql()),
    chQuery(connectionTypesBuilder.getSql()),
    chQuery(languagesBuilder.getSql()),
    chQuery(timezonesBuilder.getSql()),
    chQuery(performanceBuilder.getSql())
  ]);

  // Process and transform the data
  const processedBrowserVersions = processBrowserVersions(browserVersions);
  const processedReferrers = parseReferrers(topReferrers as ReferrerData[], true);
  const processedDeviceTypes = processDeviceTypes(deviceTypeResults);
  const processedCountries = processCountries(countries);
  const processedTopPages = processPages(topPages);
  const processedTodayTopPages = processPages(todayTopPages);

  return {
    summaryData: summaryData[0],
    todayData: todayData[0],
    eventsByDate,
    topPages: processedTopPages,
    todayTopPages: processedTodayTopPages,
    referrers: processedReferrers,
    browserVersions: processedBrowserVersions,
    countries: processedCountries,
    deviceTypes: processedDeviceTypes,
    resolutions,
    connectionTypes,
    languages,
    timezones,
    performance: performance[0],
    dateRange: { startDate, endDate, granularity: params.granularity || 'daily' },
    today
  };
}

/**
 * Fetch trends data for a website
 */
export async function fetchTrendsData(params: AnalyticsQueryParams) {
  const { startDate, endDate } = getDefaultDateRange(params.end_date, params.start_date);
  const today = new Date().toISOString().split('T')[0];
  
  // Create builders
  const eventsByDateBuilder = createEventsByDateBuilder(
    params.website_id, 
    startDate, 
    endDate, 
    params.granularity as 'hourly' | 'daily' || 'daily'
  );
  
  // Get historical data
  const eventsByDate = await chQuery(eventsByDateBuilder.getSql());
  
  // Get today's data if needed
  if (today >= startDate && today <= endDate) {
    const todayBuilder = createTodayBuilder(params.website_id);
    const todayData = await chQuery(todayBuilder.getSql());
    
    return {
      eventsByDate,
      todayData: todayData[0],
      dateRange: { startDate, endDate, granularity: params.granularity || 'daily' },
      today
    };
  }
  
  return {
    eventsByDate,
    todayData: null,
    dateRange: { startDate, endDate, granularity: params.granularity || 'daily' },
    today
  };
}

/**
 * Fetch chart data with metrics for visualization
 */
export async function fetchChartData(params: AnalyticsQueryParams) {
  const { startDate, endDate } = getDefaultDateRange(params.end_date, params.start_date);
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate days difference
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determine interval
  const intervalData = determineInterval(params.interval || 'day', daysDiff);
  
  // Create builders
  const metricsBuilder = createMetricsBuilder(
    params.website_id, 
    startDate, 
    endDate, 
    intervalData.intervalFunc, 
    intervalData.intervalName
  );
  
  const hourlyBuilder = createHourlyBuilder(params.website_id, startDate, endDate);
  
  // Execute queries
  const [metrics, hourlyDistribution] = await Promise.all([
    chQuery(metricsBuilder),
    chQuery(hourlyBuilder)
  ]);
  
  // Get today's data if needed
  if (today >= startDate && today <= endDate) {
    const todayBuilder = createTodayBuilder(params.website_id);
    const todayData = await chQuery(todayBuilder.getSql());
    
    return {
      metrics,
      hourlyDistribution,
      todayData: todayData[0],
      dateRange: { startDate, endDate },
      interval: intervalData.intervalName,
      daysDiff,
      today
    };
  }
  
  return {
    metrics,
    hourlyDistribution,
    todayData: null,
    dateRange: { startDate, endDate },
    interval: intervalData.intervalName,
    daysDiff,
    today
  };
}

// Helper functions
function processBrowserVersions(browserVersions: any[]) {
  return browserVersions.map(item => {
    const userAgentInfo = parseUserAgent(item.user_agent);
    return {
      browser: userAgentInfo.browser || 'Unknown',
      version: extractBrowserVersion(item.user_agent) || 'Unknown',
      count: item.count,
      visitors: item.visitors
    };
  });
}

function processDeviceTypes(deviceTypeResults: any[]) {
  const deviceTypes = deviceTypeResults.map(item => {
    const userAgentInfo = parseUserAgent(item.user_agent);
    return {
      device_type: userAgentInfo.device || 'Unknown',
      visitors: item.visitors,
      pageviews: item.pageviews
    };
  }).reduce((acc, current) => {
    const existing = acc.find(item => item.device_type === current.device_type);
    if (existing) {
      existing.visitors += current.visitors;
      existing.pageviews += current.pageviews;
    } else {
      acc.push(current);
    }
    return acc;
  }, [] as Array<{device_type: string, visitors: number, pageviews: number}>);
  
  // Sort by visitors
  return deviceTypes.sort((a, b) => b.visitors - a.visitors);
}

function processCountries(countries: any[]) {
  return countries.map(country => ({
    ...country,
    country: country.country?.trim() ? country.country : 'Unknown'
  }));
}

function processPages(pages: any[]) {
  return pages.map(page => {
    const cleanPath = formatCleanPath(page.path);
    const timeOnPage = page.avg_time_on_page || 0;
    
    return {
      pageviews: page.pageviews,
      visitors: page.visitors,
      path: cleanPath,
      avg_time_on_page: timeOnPage,
      avg_time_on_page_formatted: formatTime(timeOnPage)
    };
  });
}

function determineInterval(interval: string, daysDiff: number) {
  let intervalFunc = "toDate(time)";
  let intervalName = "date";
  
  // Automatically determine interval based on date range if 'auto'
  if (interval === 'auto') {
    if (daysDiff > 90) {
      intervalFunc = "toStartOfMonth(time)";
      intervalName = "month";
    } else if (daysDiff > 30) {
      intervalFunc = "toStartOfWeek(time)";
      intervalName = "week";
    }
  } else if (interval === 'week') {
    intervalFunc = "toStartOfWeek(time)";
    intervalName = "week";
  } else if (interval === 'month') {
    intervalFunc = "toStartOfMonth(time)";
    intervalName = "month";
  }
  
  return { intervalFunc, intervalName };
}

function createMetricsBuilder(websiteId: string, startDate: string, endDate: string, intervalFunc: string, intervalName: string) {
  return `
    SELECT
      ${intervalFunc} as ${intervalName},
      COUNT(CASE WHEN event_name = 'screen_view' THEN 1 END) as pageviews,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(DISTINCT session_id) as sessions,
      AVG(is_bounce) * 100 as bounce_rate,
      AVG(CASE WHEN event_name = 'screen_view' THEN time_on_page ELSE 0 END) as avg_session_duration
    FROM analytics.events
    WHERE
      client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
    GROUP BY ${intervalFunc}
    ORDER BY ${intervalName} ASC
  `;
}

function createHourlyBuilder(websiteId: string, startDate: string, endDate: string) {
  return `
    SELECT
      toHour(time) as hour,
      COUNT(*) as events,
      COUNT(DISTINCT anonymous_id) as visitors
    FROM analytics.events
    WHERE
      client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
      AND event_name = 'screen_view'
    GROUP BY hour
    ORDER BY hour ASC
  `;
}

// Extract browser version from user agent
function extractBrowserVersion(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  
  // Common browser patterns
  const patterns = [
    { regex: /Chrome\/([0-9.]+)/, index: 1 },
    { regex: /Firefox\/([0-9.]+)/, index: 1 },
    { regex: /Safari\/([0-9.]+)/, index: 1 },
    { regex: /MSIE ([0-9.]+)/, index: 1 },
    { regex: /Edg\/([0-9.]+)/, index: 1 },
    { regex: /OPR\/([0-9.]+)/, index: 1 }
  ];
  
  for (const pattern of patterns) {
    const match = userAgent.match(pattern.regex);
    if (match && match[pattern.index]) {
      // Take just the major version
      return match[pattern.index].split('.')[0];
    }
  }
  
  return 'Unknown';
} 