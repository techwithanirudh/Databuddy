import { Hono } from "hono";
import { db, websites, projects, member, eq, and, isNull } from "@databuddy/db";
import { authMiddleware } from "../../middleware/auth";
import { logger } from "../../lib/logger";
import { logger as discordLogger } from "../../lib/discord-webhook";
import { nanoid } from "nanoid";
import { cacheable } from "@databuddy/redis";
import type { AppVariables } from "../../types";
import { z } from "zod";
import { websiteAuthHook } from "../../middleware/website";
import { Autumn as autumn } from "autumn-js";
import { auth } from "../../middleware/betterauth";
import type { User, Session } from "@databuddy/auth";

type WebsitesContext = {
	Variables: AppVariables & {
		user: User;
		session: Session;
	};
};

export const websitesRouter = new Hono<WebsitesContext>();

const createWebsiteSchema = z.object({
	name: z
		.string()
		.min(1)
		.max(100)
		.regex(/^[a-zA-Z0-9\s\-_.]+$/, "Invalid website name format"),
	domain: z.preprocess((val) => {
		if (typeof val !== "string") {
			return val;
		}
		let domain = val.trim();
		if (domain.startsWith("http://") || domain.startsWith("https://")) {
			try {
				domain = new URL(domain).hostname;
			} catch (e) {
				// let validation fail
			}
		}
		return domain;
	}, z.string()
		.min(1)
		.max(253)
		.regex(
			/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/,
			"Invalid domain format"
		)),
	subdomain: z
		.string()
		.max(63)
		.regex(/^[a-zA-Z0-9-]*$/, "Invalid subdomain format")
		.optional(),
});

const updateWebsiteSchema = z.object({
	name: z
		.string()
		.min(1)
		.max(100)
		.regex(/^[a-zA-Z0-9\s\-_.]+$/, "Invalid website name format"),
});

// Organization context utilities
function getOrganizationId(session: Session): string | null {
	return session.session?.activeOrganizationId || null;
}

async function getBillingCustomerId(
	userId: string,
	organizationId?: string | null,
): Promise<string> {
	if (!organizationId) return userId;

	if (!userId) {
		throw new Error("User ID is required for billing customer ID");
	}

	const orgOwnerId = await getOrganizationOwnerId(organizationId);
	return orgOwnerId || userId;
}

async function checkOrganizationPermissions(
	headers: Headers,
	permissions: Record<string, string[]>,
): Promise<boolean> {
	try {
		const { success } = await cacheable(auth.api.hasPermission, {
			expireInSec: 60,
			prefix: "has-permission",
		})({
			headers,
			body: { permissions },
		});
		return success;
	} catch (error) {
		logger.error("[Website API] Error checking organization permissions:", {
			error,
		});
		return false;
	}
}

async function handleAutumnLimits(
	customerId: string,
	action: "check" | "track",
	value = 1,
) {
	if (!customerId) {
		logger.warn("[Website API] No customer ID provided for autumn limits");
		return action === "check"
			? { allowed: true, data: null }
			: { success: false };
	}

	try {
		if (action === "check") {
			const { data } = await autumn.check({
				customer_id: customerId,
				feature_id: "websites",
			});

			if (data && !data.allowed) {
				return { allowed: false, error: "Website creation limit exceeded" };
			}

			return { allowed: true, data };
		}
		await autumn.track({
			customer_id: customerId,
			feature_id: "websites",
			value,
		});
		return { success: true };
	} catch (error) {
		logger.error(`[Website API] Error with autumn ${action}:`, { error });
		return action === "check"
			? { allowed: true, data: null }
			: { success: false };
	}
}

async function _getOrganizationOwnerId(
	organizationId: string,
): Promise<string | null> {
	if (!organizationId) return null;

	try {
		const orgMember = await db.query.member.findFirst({
			where: and(
				eq(member.organizationId, organizationId),
				eq(member.role, "owner"),
			),
			columns: { userId: true },
		});

		return orgMember?.userId || null;
	} catch (error) {
		logger.error("[Website API] Error fetching organization owner:", {
			error,
			organizationId,
		});
		return null;
	}
}

const getOrganizationOwnerId = cacheable(_getOrganizationOwnerId, {
	expireInSec: 300,
	prefix: "org_owner",
	staleWhileRevalidate: true,
	staleTime: 60,
});

async function checkWebsiteExists(
	domain: string,
	userId: string,
	organizationId: string | null,
): Promise<boolean> {
	if (organizationId) {
		const existingWebsite = await db.query.websites.findFirst({
			where: and(
				eq(websites.domain, domain),
				eq(websites.organizationId, organizationId),
			),
		});
		return !!existingWebsite;
	}

	const existingWebsite = await db.query.websites.findFirst({
		where: and(
			eq(websites.domain, domain),
			eq(websites.userId, userId),
			isNull(websites.organizationId),
		),
	});
	return !!existingWebsite;
}

websitesRouter.use("*", authMiddleware);

websitesRouter.post("/", async (c) => {
	const user = c.get("user") as User;
	const session = c.get("session") as Session;
	const rawData = await c.req.json();
	const organizationId = getOrganizationId(session);

	if (!user) {
		return c.json({ success: false, error: "Unauthorized" }, 401);
	}

	try {
		const validationResult = createWebsiteSchema.safeParse(rawData);
		if (!validationResult.success) {
			return c.json({ success: false, error: "Invalid input data" }, 400);
		}

		const data = validationResult.data;
		logger.info("[Website API] Creating website:", {
			...data,
			userId: user.id,
			organizationId,
		});

		// Check organization permissions if creating in organization context
		if (organizationId) {
			const hasPermission = await checkOrganizationPermissions(
				c.req.raw.headers,
				{ website: ["create"] },
			);

			if (!hasPermission) {
				return c.json(
					{
						success: false,
						error:
							"You don't have permission to create websites in this organization.",
					},
					403,
				);
			}
		}

		// Check billing limits
		const customerId = await getBillingCustomerId(user.id, organizationId);
		const limitCheck = await handleAutumnLimits(customerId, "check");

		if (!limitCheck.allowed) {
			return c.json(
				{
					success: false,
					error: limitCheck.error || "Creation limit exceeded",
				},
				400,
			);
		}

		// Build full domain
		const fullDomain = data.subdomain
			? `${data.subdomain}.${data.domain}`
			: data.domain;

		// Check if website already exists
		const websiteExists = await checkWebsiteExists(fullDomain, user.id, organizationId);
		if (websiteExists) {
			const context = organizationId ? "this organization" : "your account";
			return c.json(
				{
					success: false,
					error: `A website with the domain "${fullDomain}" already exists in ${context}.`,
				},
				409,
			);
		}

		// Create website
		const [website] = await db
			.insert(websites)
			.values({
				id: nanoid(),
				name: data.name,
				domain: fullDomain,
				userId: user.id,
				organizationId: organizationId || null,
				status: "ACTIVE",
			})
			.returning();

		// Track usage
		if (limitCheck.data?.allowed) {
			await handleAutumnLimits(customerId, "track", 1);
		}

		logger.info("[Website API] Successfully created website:", website);
		await discordLogger.success(
			"Website Created",
			`New website "${data.name}" was created with domain "${fullDomain}"`,
			{
				websiteId: website.id,
				websiteName: data.name,
				domain: fullDomain,
				userId: user.id,
			},
		);

		return c.json({ success: true, data: website });
	} catch (error) {
		logger.error("[Website API] Error creating website:", { error });
		return c.json(
			{
				success: false,
				error:
					error instanceof Error
						? `Failed to create website: ${error.message}`
						: "Failed to create website",
			},
			500,
		);
	}
});

websitesRouter.patch(
	"/:id",
	websiteAuthHook({ website: ["update"] }),
	async (c) => {
		const user = c.get("user");
		const id = c.req.param("id");
		const rawData = await c.req.json();
		const website = c.get("website");

		if (!user) {
			return c.json({ success: false, error: "Unauthorized" }, 401);
		}

		try {
			const validationResult = updateWebsiteSchema.safeParse(rawData);
			if (!validationResult.success) {
				return c.json({ success: false, error: "Invalid input data" }, 400);
			}

			const { name } = validationResult.data;
			logger.info("[Website API] Updating website name:", {
				id,
				name,
				userId: user.id,
			});

			if (!website) {
				return c.json(
					{
						success: false,
						error: "Website not found or you do not have permission.",
					},
					404,
				);
			}

			const [updatedWebsite] = await db
				.update(websites)
				.set({ name })
				.where(eq(websites.id, id))
				.returning();

			logger.info(
				"[Website API] Successfully updated website:",
				updatedWebsite,
			);

			await discordLogger.info(
				"Website Updated",
				`Website "${website.name}" was renamed to "${name}"`,
				{
					websiteId: id,
					oldName: website.name,
					newName: name,
					domain: website.domain,
					userId: user.id,
				},
			);

			return c.json({ success: true, data: updatedWebsite });
		} catch (error) {
			logger.error("[Website API] Error updating website:", { error });
			return c.json(
				{
					success: false,
					error:
						error instanceof Error
							? `Failed to update website: ${error.message}`
							: "Failed to update website",
				},
				500,
			);
		}
	},
);

websitesRouter.post(
	"/:id/transfer",
	websiteAuthHook({ website: ["update"] }),
	async (c) => {
		const user = c.get("user");
		const website = c.get("website");
		const { organizationId } = await c.req.json();

		if (!user || !website) {
			return c.json(
				{ success: false, error: "Unauthorized or website not found" },
				401,
			);
		}

		try {
			if (organizationId && typeof organizationId !== "string") {
				return c.json(
					{ success: false, error: "Invalid organization ID format" },
					400,
				);
			}

			if (organizationId) {
				const hasPermission = await checkOrganizationPermissions(
					c.req.raw.headers,
					{ website: ["create"] },
				);

				if (!hasPermission) {
					return c.json(
						{
							success: false,
							error:
								"You don't have permission to transfer websites to this organization.",
						},
						403,
					);
				}
			}

			const [updatedWebsite] = await db
				.update(websites)
				.set({
					organizationId: organizationId || null,
					userId: organizationId ? website.userId : user.id,
				})
				.where(eq(websites.id, website.id))
				.returning();

			return c.json({ success: true, data: updatedWebsite });
		} catch (error) {
			logger.error("[Website API] Error transferring website:", { error });
			return c.json(
				{ success: false, error: "Failed to transfer website" },
				500,
			);
		}
	},
);

websitesRouter.get("/", async (c) => {
	const user = c.get("user");
	const session = c.get("session") as Session;
	const organizationId = getOrganizationId(session);

	if (!user) {
		return c.json({ success: false, error: "Unauthorized" }, 401);
	}

	try {
		const whereCondition = organizationId
			? eq(websites.organizationId, organizationId)
			: and(eq(websites.userId, user.id), isNull(websites.organizationId));

		const userWebsites = await db.query.websites.findMany({
			where: whereCondition,
			orderBy: (websites, { desc }) => [desc(websites.createdAt)],
		});

		return c.json({ success: true, data: userWebsites });
	} catch (error) {
		logger.error("[Website API] Error fetching websites:", {
			error,
			organizationId,
		});
		return c.json({ success: false, error: "Failed to fetch websites" }, 500);
	}
});

websitesRouter.get("/:id", websiteAuthHook(), async (c) => {
	const website = c.get("website");

	if (!website) {
		return c.json(
			{
				success: false,
				error: "Website not found or you do not have permission to access it.",
			},
			404,
		);
	}

	return c.json({ success: true, data: website });
});

websitesRouter.delete(
	"/:id",
	websiteAuthHook({ website: ["delete"] }),
	async (c) => {
		const user = c.get("user");
		const id = c.req.param("id");
		const website = c.get("website");

		if (!user) {
			return c.json({ success: false, error: "Unauthorized" }, 401);
		}

		try {
			if (!website) {
				return c.json(
					{
						success: false,
						error: "Website not found or you do not have permission.",
					},
					404,
				);
			}

			await db.delete(websites).where(eq(websites.id, id));
			const customerId = await getBillingCustomerId(user.id, (website as any).organizationId || null);
			await handleAutumnLimits(customerId, "track", -1);

			await discordLogger.warning(
				"Website Deleted",
				`Website "${website.name}" with domain "${website.domain}" was deleted`,
				{
					websiteId: id,
					websiteName: website.name,
					domain: website.domain,
					userId: user.id,
				},
			);

			return c.json({ success: true, data: { success: true } });
		} catch (error) {
			logger.error("[Website API] Error deleting website:", { error });
			return c.json({ success: false, error: "Failed to delete website" }, 500);
		}
	},
);

export default websitesRouter;
