"use server";

import { chQuery } from "@databuddy/db";

export interface ReferrerData {
  referrer: string;
  count: number;
  unique_users: number;
  avg_time_on_site: number;
  bounce_rate: number;
}

export interface DataExplorerParams {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
  client_id?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export async function fetchReferrerData(params: DataExplorerParams = {}) {
  try {
    const {
      limit = 25,
      offset = 0,
      from,
      to,
      client_id,
      search,
      sort_by = 'count',
      sort_order = 'desc'
    } = params;

    const conditions = [];
    if (from) conditions.push(`time >= parseDateTimeBestEffort('${from}')`);
    if (to) conditions.push(`time <= parseDateTimeBestEffort('${to}')`);
    if (client_id) conditions.push(`client_id = '${client_id}'`);
    if (search) {
      conditions.push(`referrer LIKE '%${search}%'`);
    }
    // Add referrer conditions
    conditions.push('referrer IS NOT NULL');
    conditions.push("referrer != ''");

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total unique referrers
    const totalQuery = `
      SELECT count(DISTINCT referrer) as total 
      FROM analytics.events
      ${whereClause}
    `;
    
    const totalResult = await chQuery<{ total: number }>(totalQuery);
    const total = totalResult[0]?.total || 0;

    // Fetch referrer data with metrics
    const referrersQuery = `
      SELECT
        referrer,
        count() as count,
        count(DISTINCT anonymous_id) as unique_users,
        avg(time_on_site) as avg_time_on_site,
        (countIf(session_length = 1) / count()) * 100 as bounce_rate
      FROM (
        SELECT
          referrer,
          anonymous_id,
          session_id,
          max(time) - min(time) as time_on_site,
          count() as session_length
        FROM analytics.events
        ${whereClause}
        GROUP BY referrer, anonymous_id, session_id
      )
      GROUP BY referrer
      ORDER BY ${sort_by} ${sort_order}
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    
    const data = await chQuery<ReferrerData>(referrersQuery);
    
    return { data, total };
  } catch (error) {
    console.error("Error fetching referrer data:", error);
    return { data: [], total: 0, error: String(error) };
  }
} 