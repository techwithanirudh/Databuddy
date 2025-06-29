import type { Context } from '../trpc';
import { TRPCError } from '@trpc/server';
import { eq, websites } from '@databuddy/db';

type Permission = 'read' | 'update' | 'delete' | 'transfer';

/**
 * A utility to centralize authorization checks for websites.
 * It verifies if a user has the required permissions for a specific website,
 * checking for ownership or organization roles.
 *
 * @throws {TRPCError} if the user is not authorized.
 */
export async function authorizeWebsiteAccess(
    ctx: Context,
    websiteId: string,
    permission: Permission
) {
    const [website] = await ctx.db.query.websites.findMany({
        where: eq(websites.id, websiteId),
        limit: 1,
    });

    if (!website) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Website not found.' });
    }

    if (ctx.user.role === 'ADMIN') {
        return website;
    }

    if (website.organizationId) {
        const { success } = await ctx.auth.api.hasPermission({
            headers: ctx.headers,
            body: { permissions: { website: [permission] } }
        });
        if (!success) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' });
        }
    } else {
        if (website.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not the owner of this website.' });
        }
    }

    return website;
} 