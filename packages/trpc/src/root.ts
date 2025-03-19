import { router, createTRPCRouter } from './trpc';
// import { userRouter } from './routers/user';
// import { postRouter } from './routers/post';
import { projectRouter } from './routers/project';

export const appRouter = router({
//   user: userRouter,
//   post: postRouter,
  project: projectRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter; 