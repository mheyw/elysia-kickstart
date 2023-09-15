import { html } from '@elysiajs/html';
import { staticPlugin } from '@elysiajs/static';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { SignIn, SignOut } from './components/auth';
import { Layout } from './components/Layout';
import { getSession } from './lib/auth';
import { router as apiRouter } from './router/api/router';
import { router as todosRouter } from './router/todos/router';

/**
 * Elysia's ctx.request is always http://
 * This function returns a new Request object with https://
 * under a condition, otherwise the redirect_uri will mismatch
 * and authentication will fail
 */
const fixCtxRequest = (request: Request) => {
  if (process.env.NODE_ENV !== 'production') {
    return request;
  }

  const httpsUrl = request.url.replace('http://', 'https://');

  const newRequest = new Request(httpsUrl, {
    body: request.body,
    headers: request.headers,
    method: request.method,
  });

  return newRequest;
};

export const app = new Elysia()
  .derive((ctx) => ({ request: fixCtxRequest(ctx.request) }))
  .use(swagger())
  .use(apiRouter)
  .use(html())
  .use(staticPlugin())
  .get('/dist/globals.css', () => Bun.file('./dist/globals.css'))
  .use(todosRouter)
  .get('/', async (ctx) => {
    const session = await getSession(ctx.request);

    return (
      <Layout>
        <div class='px-6 py-6'>
          {session ? (
            <SignOut />
          ) : (
            <SignIn innerText='Sign in to modify todos' />
          )}
          <div class='py-3'></div>
          <div hx-get='/todos' hx-trigger='load' hx-swap='innerHTML'></div>
        </div>
      </Layout>
    );
  });

app.listen(process.env.PORT, ({ hostname, port }) => {
  console.log(`🦊 Elysia is running at http://${hostname}:${port}`);
});

export type App = typeof app;
