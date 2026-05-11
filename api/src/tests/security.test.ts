import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { jsonRequest, startTestServer, type TestServer } from './testServer.js';
import { csrfTokenResponseSchema } from '../docs/registerPath.js';
import { failEnvelopeSchema } from '../common/utils/response/format.js';
let testServer: TestServer;

function cookieHeaderFromSetCookie(setCookie: string): string {
  return setCookie.split(';')[0] ?? '';
}

before(async () => {
  testServer = await startTestServer();
});

after(async () => {
  await testServer.close();
});

void describe('security', () => {
  void it('sets baseline security headers', async () => {
    const { res } = await jsonRequest(testServer, '/health');

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);

    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.get('x-frame-options'));
  });

  void it('issues a CSRF token cookie', async () => {
    const { res, body } = await jsonRequest(testServer, '/api/csurf-token');

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const csrfBody = csrfTokenResponseSchema.parse(body);
    const csrfToken = csrfBody.csrfToken;

    assert.equal(typeof csrfToken, 'string');
    assert.ok(csrfToken.length > 0);

    const setCookie = res.headers.get('set-cookie') ?? '';
    assert.match(setCookie, /_csrf=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
  });

  void it('rejects protected routes without an access token', async () => {
    const { res, body } = await jsonRequest(testServer, '/api/auth/me');

    assert.equal(res.status, 401);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);

    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Unauthorized');
    assert.equal(failBody.code, 'UNAUTHORIZED');
  });

  void it('rejects malformed bearer tokens', async () => {
    const { res, body } = await jsonRequest(testServer, '/api/auth/me', {
      headers: {
        authorization: 'Bearer not-a-real-jwt',
      },
    });

    assert.equal(res.status, 401);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);

    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Invalid or expired token');
  });

  void it('rejects invalid request bodies', async () => {
    const { res, body } = await jsonRequest(testServer, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        password: '',
      }),
    });

    assert.equal(res.status, 400);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);

    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Invalid request body');
    assert.equal(failBody.code, 'VALIDATION_ERROR');
  });

  void it('does not echo sensitive submitted values in validation errors', async () => {
    const secretPassword = 'SuperSecretPassword123';
    const { res, body } = await jsonRequest(testServer, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'not-an-email',
        password: secretPassword,
      }),
    });

    assert.equal(res.status, 400);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);

    assert.equal(failBody.ok, false);
    assert.equal(failBody.code, 'VALIDATION_ERROR');
    assert.doesNotMatch(JSON.stringify(failBody), new RegExp(secretPassword));
  });

  void it('rejects unexpected privileged fields', async () => {
    const { res, body } = await jsonRequest(testServer, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin',
      }),
    });

    assert.equal(res.status, 400);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);

    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Invalid request body');
    assert.equal(failBody.code, 'VALIDATION_ERROR');
  });

  void it('rejects csrf-protected requests without a csrf token', async () => {
    const { res, body } = await jsonRequest(testServer, '/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 403);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);

    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Invalid CSRF token');
    assert.equal(failBody.code, 'CSRF_ERROR');
  });

  void it('rejects csrf-protected requests with a mismatched csrf token', async () => {
    const tokenResponse = await jsonRequest(testServer, '/api/csurf-token');
    const csrfCookie = cookieHeaderFromSetCookie(tokenResponse.res.headers.get('set-cookie') ?? '');

    const { res, body } = await jsonRequest(testServer, '/api/auth/refresh', {
      method: 'POST',
      headers: {
        cookie: csrfCookie,
        'csrf-token': 'mismatched-token',
      },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 403);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);

    assert.equal(failBody.ok, false);
    assert.equal(failBody.code, 'CSRF_ERROR');
  });

  void it('allows valid csrf tokens to reach refresh-token auth handling', async () => {
    const tokenResponse = await jsonRequest(testServer, '/api/csurf-token');
    const csrfBody = csrfTokenResponseSchema.parse(tokenResponse.body);
    const csrfCookie = cookieHeaderFromSetCookie(tokenResponse.res.headers.get('set-cookie') ?? '');

    const { res, body } = await jsonRequest(testServer, '/api/auth/refresh', {
      method: 'POST',
      headers: {
        cookie: csrfCookie,
        'csrf-token': csrfBody.csrfToken,
      },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 401);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);

    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Refresh token missing');
  });

  void it('reject logout without a csrf token', async () => {
    const { res, body } = await jsonRequest(testServer, '/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 403);

    const failBody = failEnvelopeSchema.parse(body);
    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Invalid CSRF token');
    assert.equal(failBody.code, 'CSRF_ERROR');
  });

  void it('allows valid csrf tokens to reach logout', async () => {
    const tokenResponse = await jsonRequest(testServer, '/api/csurf-token');
    const csrfBody = csrfTokenResponseSchema.parse(tokenResponse.body);
    const csrfCookie = cookieHeaderFromSetCookie(tokenResponse.res.headers.get('set-cookie') ?? '');

    const { res, body } = await jsonRequest(testServer, '/api/auth/logout', {
      method: 'POST',
      headers: {
        cookie: csrfCookie,
        'csrf-token': csrfBody.csrfToken,
      },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 401);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);
    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Unauthorized');
    assert.equal(failBody.code, 'UNAUTHORIZED');
  });

  void it('rejects csrf token without csrf cookie', async () => {
    const tokenResponse = await jsonRequest(testServer, '/api/csurf-token');
    const csrfBody = csrfTokenResponseSchema.parse(tokenResponse.body);

    const { res, body } = await jsonRequest(testServer, '/api/auth/logout', {
      method: 'POST',
      headers: {
        'csrf-token': csrfBody.csrfToken,
      },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 403);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);
    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Invalid CSRF token');
    assert.equal(failBody.code, 'CSRF_ERROR');
  });

  void it('rejects csrf token without csrf token header', async () => {
    const tokenResponse = await jsonRequest(testServer, '/api/csurf-token');
    const csrfCookie = cookieHeaderFromSetCookie(tokenResponse.res.headers.get('set-cookie') ?? '');

    const { res, body } = await jsonRequest(testServer, '/api/auth/logout', {
      method: 'POST',
      headers: {
        cookie: csrfCookie,
      },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 403);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);
    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Invalid CSRF token');
    assert.equal(failBody.code, 'CSRF_ERROR');
  });

  void it('feject non-bearer authorization schema', async () => {
    const { res, body } = await jsonRequest(testServer, '/api/auth/me', {
      headers: {
        authorization: 'not-a-bearer',
      },
    });

    assert.equal(res.status, 401);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);
    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Unauthorized');
    assert.equal(failBody.code, 'UNAUTHORIZED');
  });

  void it('rejects malformed json bodies', async () => {
    const { res, body } = await jsonRequest(testServer, '/api/auth/login', {
      method: 'POST',
      body: '{',
    });

    assert.equal(res.status, 400);
    assert.ok(body);

    const failBody = failEnvelopeSchema.parse(body);
    assert.equal(failBody.ok, false);
    assert.equal(failBody.message, 'Invalid request body');
    assert.equal(failBody.code, 'VALIDATION_ERROR');
  });
});
