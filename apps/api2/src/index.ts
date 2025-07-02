import { Elysia } from "elysia";
import { trpc } from '@elysiajs/trpc';
import { appRouter } from '@databuddy/rpc';

const app = new Elysia();

app.get('/', () => {
  return 'Hello World';
})
  .use(trpc(appRouter))

app.listen(3500)
  .onStart(() => {
    console.log('Server is running on port 3500');
  });

app.onError(({ error, code }) => {
  console.error(error);
  return {
    success: false,
    code: code
  };
});