"use server";

import { db } from "@databuddy/db";
import { user as usersTable, websites as websitesTable, domains as domainsTable, chQuery } from "@databuddy/db";
import { count, sql, inArray } from "drizzle-orm";

export async function getAnalyticsOverviewData() {
  try {
    const [usersResult, websitesResult, domainsResult, verifiedDomainsResult] = await Promise.all([
      db.select({ value: count() }).from(usersTable),
      db.select({ value: count() }).from(websitesTable),
      db.select({ value: count() }).from(domainsTable),
      db.select({ value: count() }).from(domainsTable).where(sql`${domainsTable.verifiedAt} is not null`)
    ]);

    const totalUsers = usersResult[0]?.value || 0;
    const totalWebsites = websitesResult[0]?.value || 0;
    const totalDomains = domainsResult[0]?.value || 0;
    const verifiedDomains = verifiedDomainsResult[0]?.value || 0;

    const eventsOverTime = await chQuery<{
      date: string;
      value: number;
    }>(`
      SELECT
        toDate(time) as date,
        count() as value
      FROM analytics.events
      WHERE time >= now() - INTERVAL 30 DAY
      GROUP BY date
      ORDER BY date ASC
    `);

    const topWebsitesRaw = await chQuery<{
      website: string;
      value: number;
    }>(`
      SELECT
        client_id as website,
        count() as value
      FROM analytics.events
      WHERE time >= now() - INTERVAL 30 DAY
      GROUP BY website
      ORDER BY value DESC
      LIMIT 5
    `);

    const websiteIds = topWebsitesRaw.map(w => w.website);
    let websiteInfo: { id: string, name: string | null, domain: string | null }[] = [];
    if (websiteIds.length > 0) {
      websiteInfo = await db.select({
        id: websitesTable.id,
        name: websitesTable.name,
        domain: websitesTable.domain
      }).from(websitesTable).where(inArray(websitesTable.id, websiteIds));
    }
    const topWebsites = topWebsitesRaw.map(w => {
      const info = websiteInfo.find(i => i.id === w.website);
      return {
        website: w.website,
        value: w.value,
        name: info?.name || null,
        domain: info?.domain || null
      };
    });

    return {
      data: {
        totalUsers,
        totalWebsites,
        totalDomains,
        verifiedDomains,
        eventsOverTime,
        topWebsites,
      },
      error: null,
    };
  } catch (err) {
    console.error("Error fetching analytics overview data for admin:", err);
    if (err instanceof Error) {
      return { data: null, error: err.message };
    }
    return { data: null, error: "An unknown error occurred while fetching analytics data." };
  }
} 