import { router } from './trpc';
import { userRouter } from './routers/user';
import { projectRouter } from './routers/project';
import { clientRouter } from './routers/client';
import { inviteRouter } from './routers/invite';
import { websiteRouter } from './routers/website';

export const appRouter = router({
  user: userRouter,
  project: projectRouter,
  client: clientRouter,
  invite: inviteRouter,
  website: websiteRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter; 