import { Elysia } from "elysia";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createTRPCContext } from '@databuddy/rpc';
import { query } from "./routes/query";
import cors from "@elysiajs/cors";

const app = new Elysia();

app.get('/', () => {
  return 'Hello World';
})
  .use(cors({
    credentials: true,
    origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://staging.databuddy.cc'
  }))
  .use(query)
  .all('/trpc/*', async ({ request }) => {
    return fetchRequestHandler({
      endpoint: '/trpc',
      router: appRouter,
      req: request,
      createContext: () => createTRPCContext({ headers: request.headers }),
    });
  });

app.listen(4000)
  .onStart(() => {
    console.log('Server is running on port 4000');
  });

app.onError(({ error, code }) => {
  console.error(error);
  return {
    success: false,
    code: code
  };
});