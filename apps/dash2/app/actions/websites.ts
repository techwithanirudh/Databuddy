"use server";

import { revalidatePath } from "next/cache";
import { db } from "@databuddy/db";
import { auth } from "@databuddy/auth";
import { headers } from "next/headers";
import { cache } from "react";
import { cacheable } from "@databuddy/redis/cacheable";

// Types
type WebsiteData = {
  domain: string;
  name: string;
  domainId?: string | null;
  userId?: string | null;
  projectId?: string | null;
};

type WebsiteUpdateData = Partial<WebsiteData>;

type ApiResponse<T> = 
  | { data: T; error?: never }
  | { data?: never; error: string };

// Cache configuration
const CACHE_CONFIG = {
  expireInSec: 3600, // 1 hour cache
  staleWhileRevalidate: true,
  staleTime: 300 // 5 minutes stale threshold
};

// Helper to get authenticated user
const getUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session) return null;
  return session.user;
});

// Helper to normalize a domain (remove protocol, www, and trailing slash)
function normalizeDomain(domain: string): string {
  if (!domain) return '';
  let normalized = domain.trim().toLowerCase();
  normalized = normalized.replace(/^(https?:\/\/)?(www\.)?/i, '');
  normalized = normalized.replace(/\/+$/, '');
  return normalized;
}

// Get normalized variations of a domain for duplicate checking
function getDomainVariations(domain: string): string[] {
  const normalized = normalizeDomain(domain);
  return [
    normalized,
    `www.${normalized}`,
    `http://${normalized}`,
    `https://${normalized}`,
    `http://www.${normalized}`,
    `https://www.${normalized}`
  ];
}

// Get project IDs where user has access
async function getUserProjectIds(userId: string): Promise<string[]> {
  return db.projectAccess.findMany({
    where: { userId },
    select: { projectId: true }
  }).then(access => access.map(a => a.projectId));
}

// Shared function to check user access to a website
async function checkWebsiteAccess(id: string, userId: string) {
  const projectIds = await getUserProjectIds(userId);
  
  return db.website.findFirst({
    where: {
      id,
      OR: [
        { userId },
        { projectId: { in: projectIds } }
      ]
    }
  });
}

// Verify domain ownership and verification status
async function verifyDomainAccess(domainId: string, ownerId: string | null, isProject = false): Promise<boolean> {
  if (!domainId || !ownerId) return false;
  
  const domain = await db.domain.findFirst({
    where: {
      id: domainId,
      verificationStatus: "VERIFIED",
      OR: [
        isProject ? { projectId: ownerId } : { userId: ownerId }
      ]
    }
  });

  return !!domain;
}

// Standardized error handler
function handleError(context: string, error: unknown): ApiResponse<never> {
  console.error(`[Website] ${context}:`, error);
  return { error: `Failed to ${context.toLowerCase()}` };
}

// Helper to invalidate all relevant website caches after modifications
async function invalidateWebsiteCaches(userId?: string | null, projectId?: string | null): Promise<void> {
  // Clear user websites cache if userId provided
  if (userId) {
    await getUserWebsites.clearAll();
  }
  
  // Clear project websites cache if projectId provided
  if (projectId) {
    await getProjectWebsites.clear(projectId);
  }
  
  // Clear individual website caches for affected entities
  const conditions = [];
  if (userId) conditions.push({ userId });
  if (projectId) conditions.push({ projectId });
  
  if (conditions.length) {
    const websites = await db.website.findMany({
      where: { OR: conditions },
      select: { id: true }
    });
    
    for (const { id } of websites) {
      await getWebsiteById.clear(id);
    }
  }
}

// Create website with proper revalidation and cache invalidation
export async function createWebsite(data: WebsiteData): Promise<ApiResponse<any>> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const normalizedDomain = normalizeDomain(data.domain);
    if (!normalizedDomain) return { error: "Invalid domain" };
    
    // Check for existing website with this domain
    const existingWebsite = await db.website.findFirst({
      where: {
        OR: getDomainVariations(normalizedDomain).map(domain => ({ domain }))
      }
    });

    if (existingWebsite) {
      return { error: "Website already exists with this domain" };
    }

    // Determine ownership
    const ownerData: Record<string, string> = {};
    if (data.userId) {
      ownerData.userId = data.userId;
    } else if (data.projectId) {
      ownerData.projectId = data.projectId;
    } else {
      ownerData.userId = user.id;
    }

    // Verify domain access if domainId is provided
    const ownerId = ownerData.userId || ownerData.projectId;
    const isProject = !!ownerData.projectId;
    
    if (data.domainId && !(await verifyDomainAccess(data.domainId, ownerId, isProject))) {
      return { error: "Domain not found or not verified" };
    }

    // Create website
    const website = await db.website.create({
      data: {
        domain: normalizedDomain,
        name: data.name,
        domainId: data.domainId,
        ...ownerData
      }
    });
    
    // Invalidate caches and revalidate paths
    await invalidateWebsiteCaches(ownerData.userId, ownerData.projectId);
    revalidatePath("/websites");
    
    return { data: website };
  } catch (error) {
    return handleError("Create website", error);
  }
}

// Get all websites for current user with Redis caching
export const getUserWebsites = cacheable(
  async (userId?: string | null): Promise<ApiResponse<any>> => {
    const user = userId ? { id: userId } : await getUser();
    if (!user) return { error: "Unauthorized" };

    try {
      const websites = await db.website.findMany({
        where: { userId: user.id },
        include: { verifiedDomain: true },
        orderBy: { createdAt: 'desc' }
      });
      
      return { data: websites };
    } catch (error) {
      return handleError("Fetch user websites", error);
    }
  },
  { ...CACHE_CONFIG, prefix: 'user-websites' }
);

// Get all websites for a project with Redis caching
export const getProjectWebsites = cacheable(
  async (projectId: string): Promise<ApiResponse<any>> => {
    const user = await getUser();
    if (!user) return { error: "Unauthorized" };

    try {
      // Check if user has access to the project
      const projectAccess = await db.projectAccess.findFirst({
        where: { projectId, userId: user.id }
      });

      if (!projectAccess) {
        return { error: "You don't have access to this project" };
      }

      const websites = await db.website.findMany({
        where: { projectId },
        include: { verifiedDomain: true },
        orderBy: { createdAt: 'desc' }
      });
      
      return { data: websites };
    } catch (error) {
      return handleError("Fetch project websites", error);
    }
  },
  { ...CACHE_CONFIG, prefix: 'project-websites' }
);

// Get single website by ID with Redis caching
export const getWebsiteById = cacheable(
  async (id: string): Promise<ApiResponse<any>> => {
    const user = await getUser();
    if (!user) return { error: "Unauthorized" };

    try {
      const projectIds = await getUserProjectIds(user.id);
      
      const website = await db.website.findFirst({
        where: {
          id,
          OR: [
            { userId: user.id },
            { projectId: { in: projectIds } }
          ]
        },
        include: { verifiedDomain: true }
      });
      
      if (!website) {
        return { error: "Website not found" };
      }
      
      return { data: website };
    } catch (error) {
      return handleError("Fetch website", error);
    }
  },
  { ...CACHE_CONFIG, prefix: 'website-by-id' }
);

// Update website with cache invalidation
export async function updateWebsite(id: string, data: WebsiteUpdateData): Promise<ApiResponse<any>> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const website = await checkWebsiteAccess(id, user.id);
    if (!website) {
      return { error: "Website not found" };
    }

    // Verify domain if provided
    if (data.domainId) {
      const ownerId = website.userId || website.projectId;
      const isProject = !!website.projectId;
      
      if (!(await verifyDomainAccess(data.domainId, ownerId, isProject))) {
        return { error: "Domain not found or not verified" };
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      name: data.name,
      domainId: data.domainId
    };

    if (data.domain) {
      updateData.domain = normalizeDomain(data.domain);
    }
    
    // Remove undefined fields
    for (const key of Object.keys(updateData)) {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    }
    
    // Update website
    const updated = await db.website.update({
      where: { id },
      data: updateData
    });

    // Invalidate caches and revalidate paths
    await invalidateWebsiteCaches(website.userId, website.projectId);
    await getWebsiteById.clear(id);
    revalidatePath("/websites");
    revalidatePath(`/websites/${id}`);
    
    return { data: updated };
  } catch (error) {
    return handleError("Update website", error);
  }
}

// Delete website with cache invalidation
export async function deleteWebsite(id: string): Promise<ApiResponse<{ success: boolean }>> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const website = await checkWebsiteAccess(id, user.id);
    if (!website) {
      return { error: "Website not found" };
    }

    // Delete website
    await db.website.delete({ where: { id } });

    // Invalidate caches and revalidate paths
    await invalidateWebsiteCaches(website.userId, website.projectId);
    await getWebsiteById.clear(id);
    revalidatePath("/websites");
    
    return { data: { success: true } };
  } catch (error) {
    return handleError("Delete website", error);
  }
} 