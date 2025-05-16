"use server";

import { chQuery } from "@databuddy/db";

export interface ClickhouseEvent {
  id: string;
  client_id: string;
  event_name: string;
  anonymous_id: string;
  time: string;
  session_id: string;
  referrer: string | null;
  url: string;
  path: string;
  title: string | null;
  ip: string;
  user_agent: string;
  browser_name: string | null;
  browser_version: string | null;
  os_name: string | null;
  os_version: string | null;
  device_type: string | null;
  screen_resolution: string | null;
  language: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  properties: string;
  created_at: string;
  [key: string]: any;
}

export interface EventsQueryParams {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
  client_id?: string;
  event_name?: string;
  search?: string;
}

export async function fetchEvents(params: EventsQueryParams = {}) {
  try {
    const {
      limit = 25,
      offset = 0,
      from,
      to,
      client_id,
      event_name,
      search,
    } = params;

    // Build the query conditions
    const conditions = [];
    if (from) conditions.push(`time >= parseDateTimeBestEffort('${from}')`);
    if (to) conditions.push(`time <= parseDateTimeBestEffort('${to}')`);
    if (client_id) conditions.push(`client_id = '${client_id}'`);
    if (event_name) conditions.push(`event_name = '${event_name}'`);
    if (search) {
      conditions.push(`(
        id LIKE '%${search}%' OR 
        event_name LIKE '%${search}%' OR
        url LIKE '%${search}%' OR
        path LIKE '%${search}%' OR
        title LIKE '%${search}%' OR
        properties LIKE '%${search}%'
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total matching events
    const totalQuery = `
      SELECT count() as total 
      FROM analytics.events
      ${whereClause}
    `;
    
    const totalResult = await chQuery<{ total: number }>(totalQuery);
    const total = totalResult[0]?.total || 0;

    // Fetch events with pagination
    const eventsQuery = `
      SELECT *
      FROM analytics.events
      ${whereClause}
      ORDER BY time DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    
    const data = await chQuery<ClickhouseEvent>(eventsQuery);
    
    return { data, total };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { data: [], total: 0, error: String(error) };
  }
} 