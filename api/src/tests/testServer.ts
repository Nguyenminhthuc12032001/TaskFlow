import assert from 'node:assert';
import { createServer, type Server } from 'node:http';

process.env.NODE_ENV ??= 'test';
process.env.LOG_LEVEL ??= 'silent';
process.env.CORS_ORIGIN ??= '*';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/taskflow_test';
process.env.FRONTEND_URL ??= 'http://localhost:5173';
process.env.EMAIL_USER ??= 'test@example.com';
process.env.EMAIL_APP_PASSWORD ??= 'test-password';
process.env.EMAIL_FROM ??= 'TaskFlow <test@example.com>';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-123';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-123';
process.env.JWT_RESET_SECRET ??= 'test-reset-secret-123';
process.env.JWT_INVITE_SECRET ??= 'test-invite-secret-123';
process.env.INVITE_TOKEN_SECRET ??= 'test-invite-token-secret-123';

export type TestServer = {
  baseUrl: string;
  close: () => Promise<void>;
};

export async function startTestServer(): Promise<TestServer> {
  const [{ default: app }, { db }] = await Promise.all([
    import('../app.js'),
    import('../db/prisma.js'),
  ]);

  const server: Server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);

    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);

      resolve();
    });
  });

  const address = server.address();
  assert.ok(address);
  assert.equal(typeof address, 'object');

  if (address == null || typeof address === 'string') {
    throw new Error('Expected server.address() to return AddressInfo');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      await db.$disconnect();
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
  };
}

type JsonResponse = {
  res: Response;
  body: unknown;
};

export async function jsonRequest(
  testServer: TestServer,
  path: string,
  init: RequestInit = {},
): Promise<JsonResponse> {
  const res = await fetch(`${testServer.baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();

  return {
    res,
    body: text ? JSON.parse(text) : undefined,
  };
}
