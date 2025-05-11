"use server";

import { db, domains as domainsTable, websites as websitesTable, user as usersTable } from "@databuddy/db";
import { eq, desc } from "drizzle-orm";

export async function getAllDomainsAsAdmin() {
  // TODO: Implement admin authentication/authorization
  try {
    const domainList = await db
      .select({
        id: domainsTable.id,
        name: domainsTable.name,
        verifiedAt: domainsTable.verifiedAt,
        verificationStatus: domainsTable.verificationStatus,
        createdAt: domainsTable.createdAt,
        userId: domainsTable.userId,
        ownerName: usersTable.name,
        ownerEmail: usersTable.email,
        ownerImage: usersTable.image,
        websiteName: websitesTable.name,
        websiteId: websitesTable.id
      })
      .from(domainsTable)
      .leftJoin(usersTable, eq(domainsTable.userId, usersTable.id))
      .leftJoin(websitesTable, eq(websitesTable.domainId, domainsTable.id))
      .orderBy(desc(domainsTable.createdAt));

    return { domains: domainList, error: null };
  } catch (err) {
    console.error("Error fetching domains for admin:", err);
    if (err instanceof Error) {
      return { domains: [], error: err.message };
    }
    return { domains: [], error: "An unknown error occurred while fetching domains." };
  }
} 