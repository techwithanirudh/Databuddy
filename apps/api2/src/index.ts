import { Elysia } from "elysia";

const app = new Elysia();

app.get('/', () => {
  return 'Hello World';
});

app.listen(3000);