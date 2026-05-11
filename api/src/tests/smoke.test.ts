import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { jsonRequest, startTestServer, type TestServer } from './testServer.js';
import { failEnvelopeSchema } from '../common/utils/response/format.js';

let testServer: TestServer;

before(async () => {
  testServer = await startTestServer();
});

after(async () => {
  await testServer.close();
});

void describe('smoke', () => {
  void it('GET /health return ok', async () => {
    const { res, body } = await jsonRequest(testServer, '/health');

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);

    assert.deepEqual(body, { ok: true });
  });

  void it('unknown route returns 404', async () => {
    const { res, body } = await jsonRequest(testServer, '/unknown');

    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);

    const failBody = failEnvelopeSchema.parse(body);

    assert.match(failBody.message, /Route not found/);
    assert.equal(failBody.code, 'ROUTE_NOT_FOUND');
  });
});
