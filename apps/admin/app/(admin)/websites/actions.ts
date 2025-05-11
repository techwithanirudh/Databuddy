'use server';

import { db, websites as websitesTable, user as usersTable } from '@databuddy/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from "next/cache";
// import { isAdminUser } from '@/lib/auth-admin'; // Placeholder

/**
 * Server Action to fetch all websites for the admin dashboard.
 * Includes basic user information (owner) for display.
 */
export async function getAllWebsitesAsAdmin() {
  // TODO: Implement robust authentication and authorization.
  // if (!isAdminUser()) return { error: 'Unauthorized', websites: [] };

  try {
    const allWebsites = await db
      .select({
        // Select specific fields from websitesTable
        id: websitesTable.id,
        name: websitesTable.name,
        domain: websitesTable.domain, // Assuming domain is a simple string field on the websites table
        createdAt: websitesTable.createdAt,
        userId: websitesTable.userId,
        // Select owner details from usersTable
        ownerName: usersTable.name,
        ownerEmail: usersTable.email,
      })
      .from(websitesTable)
      .leftJoin(usersTable, eq(websitesTable.userId, usersTable.id))
      .orderBy(desc(websitesTable.createdAt));

    return { websites: allWebsites, error: null };
  } catch (error) {
    console.error('Error fetching websites in server action:', error);
    return {
      websites: [],
      error: `Failed to fetch websites. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function updateWebsiteName(websiteId: string, newName: string) {
  try {
    await db.update(websitesTable)
      .set({ name: newName, updatedAt: new Date().toISOString() })
      .where(eq(websitesTable.id, websiteId));
    revalidatePath("/websites", "page");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update website name" };
  }
}

export async function deleteWebsite(websiteId: string) {
  try {
    await db.delete(websitesTable).where(eq(websitesTable.id, websiteId));
    revalidatePath("/websites", "page");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete website" };
  }
} 