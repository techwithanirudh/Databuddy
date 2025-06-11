import { chQuery } from "@databuddy/db";

export async function getUserAnalytics(userId: string) {
  try {
    // Get total events for all user's websites
    const totalEvents = await chQuery<{
      total_events: number;
      total_websites: number;
      total_sessions: number;
    }>(`
      SELECT 
        count() as total_events,
        count(DISTINCT website_id) as total_websites,
        count(DISTINCT session_id) as total_sessions
      FROM events
      WHERE user_id = '${userId}'
    `);

    // Get events per website
    const eventsPerWebsite = await chQuery<{
      website_id: string;
      event_count: number;
      session_count: number;
      first_event: string;
      last_event: string;
    }>(`
      SELECT 
        website_id,
        count() as event_count,
        count(DISTINCT session_id) as session_count,
        min(timestamp) as first_event,
        max(timestamp) as last_event
      FROM events
      WHERE user_id = '${userId}'
      GROUP BY website_id
      ORDER BY event_count DESC
    `);

    // Get events per day for the last 30 days
    const eventsPerDay = await chQuery<{
      date: string;
      event_count: number;
    }>(`
      SELECT 
        toDate(timestamp) as date,
        count() as event_count
      FROM events
      WHERE user_id = '${userId}'
        AND timestamp >= now() - INTERVAL 30 DAY
      GROUP BY date
      ORDER BY date ASC
    `);

    // Get top event types
    const topEventTypes = await chQuery<{
      event_type: string;
      count: number;
    }>(`
      SELECT 
        event_type,
        count() as count
      FROM events
      WHERE user_id = '${userId}'
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 10
    `);

    return {
      totalEvents: totalEvents[0] || { total_events: 0, total_websites: 0, total_sessions: 0 },
      eventsPerWebsite,
      eventsPerDay,
      topEventTypes,
    };
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return { error: "Failed to fetch analytics data" };
  }
} 