import { Hono } from 'hono';
import { db, websites, domains, projects, member, eq, and, or, inArray, sql, isNull } from '@databuddy/db';
import { authMiddleware } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { logger as discordLogger } from '../../lib/discord-webhook';
import { nanoid } from 'nanoid';
import { cacheable } from '@databuddy/redis';
import type { AppVariables } from '../../types';
import { z } from 'zod';
import { websiteAuthHook } from '../../middleware/website';
import { Autumn as autumn } from "autumn-js";
import { auth } from '../../middleware/betterauth';

type WebsitesContext = {
  Variables: AppVariables & {
    user: any;
  };
};

export const websitesRouter = new Hono<WebsitesContext>();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createWebsiteSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Invalid website name format'),
  domain: z.string().min(1).max(253).regex(/^[a-zA-Z0-9.-]+$/, 'Invalid domain format'),
  subdomain: z.string().max(63).regex(/^[a-zA-Z0-9-]*$/, 'Invalid subdomain format').optional(),
  domainId: z.string().uuid('Invalid domain ID format')
});

const updateWebsiteSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Invalid website name format')
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the billing customer ID for autumn tracking
 * Uses organization owner ID if in organization context, otherwise user ID
 */
async function getBillingCustomerId(userId: string, organizationId?: string | null): Promise<string> {
  if (!organizationId) return userId;
  
  if (!userId) {
    throw new Error('User ID is required for billing customer ID');
  }

  const orgOwnerId = await getOrganizationOwnerId(organizationId);
  return orgOwnerId || userId;
}

/**
 * Checks organization permissions using better-auth
 */
async function checkOrganizationPermissions(
  headers: Headers, 
  permissions: Record<string, string[]>
): Promise<boolean> {
  try {
    const { success } = await auth.api.hasPermission({
      headers,
      body: { permissions }
    });
    return success;
  } catch (error) {
    logger.error('[Website API] Error checking organization permissions:', { error });
    return false;
  }
}

/**
 * Handles autumn limit checking and tracking
 */
async function handleAutumnLimits(customerId: string, action: 'check' | 'track', value: number = 1) {
  if (!customerId) {
    logger.warn('[Website API] No customer ID provided for autumn limits');
    return action === 'check' ? { allowed: true, data: null } : { success: false };
  }
  
  try {
    if (action === 'check') {
      const { data } = await autumn.check({
        customer_id: customerId,
        feature_id: 'websites',
      });
      
      if (data && !data.allowed) {
        return { allowed: false, error: "Website creation limit exceeded" };
      }
      
      return { allowed: true, data };
    } else {
      await autumn.track({
        customer_id: customerId,
        feature_id: 'websites',
        value,
      });
      return { success: true };
    }
  } catch (error) {
    logger.error(`[Website API] Error with autumn ${action}:`, { error });
    // Continue without autumn if service is unavailable
    return action === 'check' ? { allowed: true, data: null } : { success: false };
  }
}

/**
 * Creates standardized error responses
 */
function createErrorResponse(message: string, status: number = 400, details?: any) {
  const response: any = { success: false, error: message };
  if (details) response.details = details;
  return { response, status };
}

/**
 * Creates standardized success responses
 */
function createSuccessResponse(data: any) {
  return { success: true, data };
}

// ============================================================================
// CACHED DATABASE FUNCTIONS
// ============================================================================

async function _getUserProjectIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  
  try {
    const userProjects = await db.query.projects.findMany({
      where: eq(projects.organizationId, userId),
      columns: { id: true }
    });
    return userProjects.map(project => project.id);
  } catch (error) {
    logger.error('[Website API] Error fetching project IDs:', { error });
    return [];
  }
}

const getUserProjectIds = cacheable(_getUserProjectIds, {
  expireInSec: 300,
  prefix: 'user_projects',
  staleWhileRevalidate: true,
  staleTime: 60
});

async function _verifyDomainAccess(domainId: string, userId: string, organizationId?: string | null): Promise<boolean> {
  if (!domainId || !userId) return false;

  try {
    const whereCondition = organizationId
      ? and(
          eq(domains.id, domainId),
          eq(domains.verificationStatus, "VERIFIED"),
          eq(domains.organizationId, organizationId)
        )
      : and(
          eq(domains.id, domainId),
          eq(domains.verificationStatus, "VERIFIED"),
          eq(domains.userId, userId),
          isNull(domains.organizationId)
        );

    const domain = await db.query.domains.findFirst({
      where: whereCondition,
      columns: { id: true }
    });

    return !!domain;
  } catch (error) {
    logger.error('[Website API] Error verifying domain access:', { error });
    return false;
  }
}

const verifyDomainAccess = cacheable(_verifyDomainAccess, {
  expireInSec: 120,
  prefix: 'domain_access',
  staleWhileRevalidate: true,
  staleTime: 30
});

async function _getOrganizationOwnerId(organizationId: string): Promise<string | null> {
  if (!organizationId) return null;
  
  try {
    const orgMember = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.role, 'owner'),
      ),
      columns: { userId: true },
    });

    return orgMember?.userId || null;
  } catch (error) {
    logger.error('[Website API] Error fetching organization owner:', { error, organizationId });
    return null;
  }
}

const getOrganizationOwnerId = cacheable(_getOrganizationOwnerId, {
  expireInSec: 300,
  prefix: 'org_owner',
  staleWhileRevalidate: true,
  staleTime: 60
});

async function checkWebsiteAccess(id: string, userId: string) {
  if (!id || !userId) return null;
  
  try {
    const projectIds = await getUserProjectIds(userId);

    return await db.query.websites.findFirst({
      where: or(
        and(eq(websites.id, id), eq(websites.userId, userId)),
        and(
          eq(websites.id, id),
          projectIds.length > 0 ? inArray(websites.projectId, projectIds) : sql`FALSE`
        )
      )
    });
  } catch (error) {
    logger.error('[Website API] Error checking website access:', { error });
    return null;
  }
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

websitesRouter.use('*', authMiddleware);

// ============================================================================
// ROUTES
// ============================================================================

/**
 * CREATE WEBSITE - POST /websites
 * Creates a new website with proper permission and limit checks
 */
websitesRouter.post('/', async (c) => {
  const user = c.get('user');
  const rawData = await c.req.json();
  const organizationId = c.req.query('organizationId');

  if (!user) {
    const { response, status } = createErrorResponse("Unauthorized", 401);
    return c.json(response, status);
  }

  try {
    // Validate input data
    const validationResult = createWebsiteSchema.safeParse(rawData);
    if (!validationResult.success) {
      const { response, status } = createErrorResponse(
        "Invalid input data", 
        400, 
        validationResult.error.issues
      );
      return c.json(response, status);
    }

    const data = validationResult.data;
    logger.info('[Website API] Creating website:', { ...data, userId: user.id, organizationId });
    
    // Check organization permissions
    if (organizationId) {
      const hasPermission = await checkOrganizationPermissions(
        c.req.raw.headers, 
        { website: ["create"] }
      );

      if (!hasPermission) {
        const { response, status } = createErrorResponse(
          "You don't have permission to create websites in this organization.", 
          403
        );
        return c.json(response, status);
      }
    }
    
    // Verify domain access
    const hasAccess = await verifyDomainAccess(data.domainId, user.id, organizationId);
    if (!hasAccess) {
      const { response, status } = createErrorResponse("Domain not found or not verified");
      return c.json(response, status);
    }

    // Check website creation limits
    const customerId = await getBillingCustomerId(user.id, organizationId);
    const limitCheck = await handleAutumnLimits(customerId, 'check');
    
    if (!limitCheck.allowed) {
      const { response, status } = createErrorResponse(limitCheck.error || "Creation limit exceeded");
      return c.json(response, status);
    }

    // Build full domain
    const fullDomain = data.subdomain ? `${data.subdomain}.${data.domain}` : data.domain;

    // Check for existing website with same domain
    const existingWebsite = await db.query.websites.findFirst({
      where: eq(websites.domain, fullDomain)
    });

    if (existingWebsite) {
      const { response, status } = createErrorResponse(
        `A website with the domain "${fullDomain}" already exists`
      );
      return c.json(response, status);
    }

    // Create website
    const [website] = await db
      .insert(websites)
      .values({
        id: nanoid(),
        name: data.name,
        domain: fullDomain,
        domainId: data.domainId,
        userId: user.id,
        organizationId: organizationId || null,
      })
      .returning();

    // Track creation with autumn (only if we got valid data and it was allowed)
    if (limitCheck.data && limitCheck.data.allowed) {
      await handleAutumnLimits(customerId, 'track', 1);
    }

    // Log success and send notifications
    logger.info('[Website API] Successfully created website:', website);
    await discordLogger.success(
      'Website Created',
      `New website "${data.name}" was created with domain "${fullDomain}"`,
      {
        websiteId: website.id,
        websiteName: data.name,
        domain: fullDomain,
        userId: user.id
      }
    );

    return c.json(createSuccessResponse(website));

  } catch (error) {
    logger.error('[Website API] Error creating website:', { error });
    const { response, status } = createErrorResponse(
      error instanceof Error ? `Failed to create website: ${error.message}` : "Failed to create website",
      500
    );
    return c.json(response, status);
  }
});

/**
 * UPDATE WEBSITE - PATCH /websites/:id
 * Updates website name with proper authorization
 */
websitesRouter.patch(
  '/:id',
  websiteAuthHook({ website: ["update"] }),
  async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const rawData = await c.req.json();
    const website = c.get('website');

    if (!user) {
      const { response, status } = createErrorResponse("Unauthorized", 401);
      return c.json(response, status);
    }

    try {
      // Validate input data
      const validationResult = updateWebsiteSchema.safeParse(rawData);
      if (!validationResult.success) {
        const { response, status } = createErrorResponse(
          "Invalid input data", 
          400, 
          validationResult.error.issues
        );
        return c.json(response, status);
      }

      const { name } = validationResult.data;
      logger.info('[Website API] Updating website name:', { id, name, userId: user.id });

      if (!website) {
        const { response, status } = createErrorResponse(
          "Website not found or you do not have permission.", 
          404
        );
        return c.json(response, status);
      }

      // Update website
      const [updatedWebsite] = await db
        .update(websites)
        .set({ name })
        .where(eq(websites.id, id))
        .returning();

      logger.info('[Website API] Successfully updated website:', updatedWebsite);

      // Send notification
      await discordLogger.info(
        'Website Updated',
        `Website "${website.name}" was renamed to "${name}"`,
        {
          websiteId: id,
          oldName: website.name,
          newName: name,
          domain: website.domain,
          userId: user.id
        }
      );

      return c.json(createSuccessResponse(updatedWebsite));

    } catch (error) {
      logger.error('[Website API] Error updating website:', { error });
      const { response, status } = createErrorResponse(
        error instanceof Error ? `Failed to update website: ${error.message}` : "Failed to update website",
        500
      );
      return c.json(response, status);
    }
  }
);

/**
 * TRANSFER WEBSITE - POST /websites/:id/transfer
 * Transfers website between personal and organization contexts
 */
websitesRouter.post(
  '/:id/transfer',
  websiteAuthHook({ website: ["update"] }),
  async (c) => {
    const user = c.get('user');
    const website = c.get('website');
    const { organizationId } = await c.req.json();

    if (!user || !website) {
      const { response, status } = createErrorResponse("Unauthorized or website not found", 401);
      return c.json(response, status);
    }

    try {
      // Validate organizationId format if provided
      if (organizationId && typeof organizationId !== 'string') {
        const { response, status } = createErrorResponse("Invalid organization ID format", 400);
        return c.json(response, status);
      }

      // Check organization permissions for transfer
      if (organizationId) {
        const hasPermission = await checkOrganizationPermissions(
          c.req.raw.headers, 
          { website: ["create"] }
        );

        if (!hasPermission) {
          const { response, status } = createErrorResponse(
            "You don't have permission to transfer websites to this organization.", 
            403
          );
          return c.json(response, status);
        }
      }

      // Perform transfer
      const [updatedWebsite] = await db.update(websites).set({
        organizationId: organizationId || null,
        // When transferring to org, keep original owner; when transferring to personal, set current user
        userId: organizationId ? website.userId : user.id,
      }).where(eq(websites.id, website.id)).returning();

      return c.json(createSuccessResponse(updatedWebsite));

    } catch (error) {
      logger.error('[Website API] Error transferring website:', { error });
      const { response, status } = createErrorResponse("Failed to transfer website", 500);
      return c.json(response, status);
    }
  }
);

/**
 * GET ALL WEBSITES - GET /websites
 * Retrieves websites based on context (personal or organization)
 */
websitesRouter.get('/', async (c) => {
  const user = c.get('user');
  const organizationId = c.req.query('organizationId');

  if (!user) {
    const { response, status } = createErrorResponse("Unauthorized", 401);
    return c.json(response, status);
  }

  try {
    const whereCondition = organizationId
      ? eq(websites.organizationId, organizationId)
      : and(eq(websites.userId, user.id), isNull(websites.organizationId));

    const userWebsites = await db.query.websites.findMany({
      where: whereCondition,
      orderBy: (websites, { desc }) => [desc(websites.createdAt)]
    });

    return c.json(createSuccessResponse(userWebsites));

  } catch (error) {
    logger.error('[Website API] Error fetching websites:', { error, organizationId });
    const { response, status } = createErrorResponse("Failed to fetch websites", 500);
    return c.json(response, status);
  }
});

/**
 * GET WEBSITES BY PROJECT - GET /websites/project/:projectId
 * Retrieves websites for a specific project
 */
websitesRouter.get('/project/:projectId', async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('projectId');

  if (!user) {
    const { response, status } = createErrorResponse("Unauthorized", 401);
    return c.json(response, status);
  }

  if (!projectId) {
    const { response, status } = createErrorResponse("Project ID is required", 400);
    return c.json(response, status);
  }

  try {
    // Check project access
    const projectAccessRecord = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.organizationId, user.id)
      )
    });

    if (!projectAccessRecord) {
      const { response, status } = createErrorResponse(
        "You don't have access to this project", 
        403
      );
      return c.json(response, status);
    }

    const projectWebsites = await db.query.websites.findMany({
      where: eq(websites.projectId, projectId),
      orderBy: (websites, { desc }) => [desc(websites.createdAt)]
    });

    return c.json(createSuccessResponse(projectWebsites));

  } catch (error) {
    logger.error('[Website API] Error fetching project websites:', { error });
    const { response, status } = createErrorResponse("Failed to fetch project websites", 500);
    return c.json(response, status);
  }
});

/**
 * GET WEBSITE BY ID - GET /websites/:id
 * Retrieves a specific website with authorization
 */
websitesRouter.get(
  '/:id',
  websiteAuthHook(),
  async (c) => {
    const website = c.get('website');

    if (!website) {
      const { response, status } = createErrorResponse(
        "Website not found or you do not have permission to access it.", 
        404
      );
      return c.json(response, status);
    }

    return c.json(createSuccessResponse(website));
  }
);

/**
 * DELETE WEBSITE - DELETE /websites/:id
 * Deletes a website with proper authorization and tracking
 */
websitesRouter.delete(
  '/:id',
  websiteAuthHook({ website: ["delete"] }),
  async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const website = c.get('website');

    if (!user) {
      const { response, status } = createErrorResponse("Unauthorized", 401);
      return c.json(response, status);
    }

    try {
      if (!website) {
        const { response, status } = createErrorResponse(
          "Website not found or you do not have permission.", 
          404
        );
        return c.json(response, status);
      }

      // Delete website
      await db.delete(websites).where(eq(websites.id, id));

      // Track deletion with autumn (unconditional decrement for existing websites)
      const customerId = await getBillingCustomerId(user.id, website.organizationId);
      await handleAutumnLimits(customerId, 'track', -1);

      // Send notification
      await discordLogger.warning(
        'Website Deleted',
        `Website "${website.name}" with domain "${website.domain}" was deleted`,
        {
          websiteId: id,
          websiteName: website.name,
          domain: website.domain,
          userId: user.id
        }
      );

      return c.json(createSuccessResponse({ success: true }));

    } catch (error) {
      logger.error('[Website API] Error deleting website:', { error });
      const { response, status } = createErrorResponse("Failed to delete website", 500);
      return c.json(response, status);
    }
  }
);

export default websitesRouter; 