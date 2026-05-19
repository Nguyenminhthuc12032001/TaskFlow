import { after, before, describe, it } from "node:test";
import { jsonRequest, startTestServer, type TestServer } from "../../testServer.js"; 
import assert from "node:assert";
import { createdEnvelopeSchema, failEnvelopeSchema, okEnvelopeSchema } from "../../../common/utils/response/format.js";
import { loginResponseSchema, registerResponseSchema, safeUserSchema } from "../../../modules/auth/auth.schemas.js";
import { cookieHeaderFromSetCookie } from "../../security.test.js";
import { registerAndLogin, uniqueEmail } from "../../helper.js";

let testServer: TestServer;

before(async () => {
    testServer = await startTestServer();
});

after(async () => {
    await testServer.close();
});

void describe('auth', () => {
    void it('registers a user and returns access token with refresh cookie', async () => {
        const email = uniqueEmail();

        const payload = {
            name: 'Test User',
            email,
            password: 'password123',
        };

        const { res, body } = await jsonRequest(testServer, '/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 201);

        const parsed = createdEnvelopeSchema(registerResponseSchema).parse(body);

        assert.equal(parsed.ok, true);
        assert.equal(parsed.created, true);
        assert.equal(parsed.data.user.email, email);
        assert.equal(parsed.data.user.name, 'Test User');
        assert.equal(typeof parsed.data.accessToken, 'string');
        assert.ok(parsed.data.accessToken.length > 0);
        assert.equal('passwordHash' in parsed.data.user, false);

        const setCookie = res.headers.get('set-cookie') ?? '';
        assert.match(setCookie, /refreshToken=/);
        assert.match(setCookie, /HttpOnly/i);
        assert.match(setCookie, /SameSite=Lax/i);
    });

    void it('reject duplicate registration email', async () => {
        const email = uniqueEmail();

        const payload = {
            name: 'Test User',
            email,
            password: 'password123',
        };

        await jsonRequest(testServer, '/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const { res, body } = await jsonRequest(testServer, '/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 409);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Email already exists');
    });

    void it('login with valid credentails', async () => {
        const { res } = await registerAndLogin(testServer); 

        const setCookie = res.headers.get('set-cookie') ?? '';
        assert.match(setCookie, /refreshToken=/);
        assert.match(setCookie, /HttpOnly/i);
        assert.match(setCookie, /SameSite=Lax/i);
    });

    void it('reject login with invalid password', async () => {
        const payload = {
            email: uniqueEmail(),
            password: 'password123',
        };

        await jsonRequest(testServer, '/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                ...payload,
                name: 'Test User',
            })
        });

        const { res, body } = await jsonRequest(testServer, '/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                ...payload,
                password: 'wrong-password',
            })
        });

        assert.equal(res.status, 401);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Invalid email or password');
        assert.equal(failBody.code, 'INVALID_EMAIL_OR_PASSWORD');
    });

    void it('reject login with unknown email', async () => {
        const payload = {
            email: uniqueEmail(),
            password: 'password123',
        };

        const { res, body } = await jsonRequest(testServer, '/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        assert.equal(res.status, 401);

        const failBody = failEnvelopeSchema.parse(body);
        assert.equal(failBody.ok, false);
        assert.equal(failBody.message, 'Invalid email or password');
        assert.equal(failBody.code, 'INVALID_EMAIL_OR_PASSWORD');
    });

    void it('returns current user with valid access token', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer);
        const loginParsed = okEnvelopeSchema(loginResponseSchema).parse(registerAndLoginResponse.body); 

        const { res, body } = await jsonRequest(testServer, '/api/auth/me', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${loginParsed.data.accessToken}`,
            }
        });

        assert.equal(res.status, 200);

        const parsed = okEnvelopeSchema(safeUserSchema).parse(body);
        assert.equal(parsed.ok, true); 
        assert.equal(parsed.data.name, 'Test User');
    });

    void it('refreshes access token with valid refresh cookie and csrf token', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer); 

        const refreshCookie = cookieHeaderFromSetCookie(registerAndLoginResponse.res.headers.get('set-cookie') ?? '');

        const csrf = await jsonRequest(testServer, '/api/csurf-token');
        const csrfCookie = cookieHeaderFromSetCookie(csrf.res.headers.get('set-cookie') ?? '');
        const csrfToken = (csrf.body as { csrfToken: string }).csrfToken;

        const { res, body } = await jsonRequest(testServer, '/api/auth/refresh', {
            method: 'POST',
            headers: {
                cookie: `${csrfCookie}; ${refreshCookie}`,
                'x-csrf-token': csrfToken,
            },
            body: JSON.stringify({}),
        });

        assert.equal(res.status, 200);

        const parsed = okEnvelopeSchema(loginResponseSchema).parse(body);
        assert.equal(parsed.ok, true);
        assert.equal(typeof parsed.data.accessToken, 'string');
        assert.ok(parsed.data.accessToken.length > 0);
        assert.equal('passwordHash' in parsed.data.user, false); 
        assert.equal(parsed.data.user.name, 'Test User');

        const newCookie = res.headers.get('set-cookie') ?? '';
        assert.match(newCookie, /refreshToken=/);
        assert.match(newCookie, /HttpOnly/i);
        assert.match(newCookie, /SameSite=Lax/i);
    });

    void it('logs out with valid access token, refresh cookie and csrf token', async () => {
        const registerAndLoginResponse = await registerAndLogin(testServer); 

        assert.equal(registerAndLoginResponse.body.ok, true);
        assert.equal(typeof registerAndLoginResponse.body.data.accessToken, 'string');
        assert.ok(registerAndLoginResponse.body.data.accessToken.length > 0);
        assert.equal('passwordHash' in registerAndLoginResponse.body.data.user, false); 
        assert.equal(registerAndLoginResponse.body.data.user.name, 'Test User');

        const refreshCookie = cookieHeaderFromSetCookie(registerAndLoginResponse.res.headers.get('set-cookie') ?? '');

        const csrf = await jsonRequest(testServer, '/api/csurf-token');
        const csrfCookie = cookieHeaderFromSetCookie(csrf.res.headers.get('set-cookie') ?? '');
        const csrfToken = (csrf.body as { csrfToken: string }).csrfToken;

        const { res } = await jsonRequest(testServer, '/api/auth/logout', {
            method: 'POST',
            headers: {
                authorization: `Bearer ${registerAndLoginResponse.body.data.accessToken}`,
                cookie: `${csrfCookie}; ${refreshCookie}`,
                'x-csrf-token': csrfToken,
            },
            body: JSON.stringify({}),
        });

        assert.equal(res.status, 204);
    });  
})
