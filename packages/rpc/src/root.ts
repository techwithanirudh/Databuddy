import { createTRPCRouter } from './trpc';
import { websitesRouter } from './routers/websites';

export const appRouter = createTRPCRouter({
  websites: websitesRouter,
});

export type AppRouter = typeof appRouter;