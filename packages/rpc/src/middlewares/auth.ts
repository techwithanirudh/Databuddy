import { t } from '../trpc';
import { TRPCError } from '@trpc/server';

export const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
        },
    });
}); 