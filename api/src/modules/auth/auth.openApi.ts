import type { ZodType } from "zod";
import { createdEnvelopeSchema, failEnvelopeSchema, okEnvelopeSchema } from "../../common/utils/response/format.js";
import { registry } from "../../docs/openapi.js";
import { loginBodySchema, loginResponseSchema, logoutBodySchema, meBodySchema, refreshResponseSchema, registerBodySchema, registerResponseSchema, safeUserSchema, forgotPasswordBodySchema, resetPasswordBodySchema, changePasswordBodySchema } from "./auth.schemas.js";

registry.registerComponent("securitySchemes", "refreshCookie", {
    type: "apiKey",
    in: "cookie",
    name: "refreshToken"
})

const fail400 = {
    description: "Bad Request / Validation error",
    content: { "application/json": { schema: failEnvelopeSchema } }
};

const fail401 = {
    description: "Unauthorized",
    content: { "application/json": { schema: failEnvelopeSchema } }
};

const fail404 = {
    description: "Not found",
    content: { "application/json": { schema: failEnvelopeSchema } }
};

const fail409 = {
    description: "Conflict",
    content: { "application/json": { schema: failEnvelopeSchema } }
};

const fail500 = {
    description: "Internal Server Error",
    content: { "application/json": { schema: failEnvelopeSchema } }
};

// POST /auth/register (public)
registry.registerPath({
    method: "post",
    path: "/auth/register",
    tags: ["Auth"],
    summary: "Register",
    security: [],
    request: {
        body: {
            content: { "application/json": { schema: registerBodySchema } }
        },
    },
    responses: {
        201: {
            description: "Register success (sets refreshToken cookie)",
            headers: {
                "Set-Cookie": {
                    schema: { type: "string" },
                    description: "HTTP-only refresh token cookie"
                }
            },
            content: {
                "application/json": { schema: createdEnvelopeSchema(registerResponseSchema) },
            }
        },
        400: fail400,
        409: fail409,
        500: fail500
    }
});

// POST /auth/login (public)
registry.registerPath({
    method: "post",
    path: "/auth/login",
    tags: ["Auth"],
    summary: "Login",
    security: [],
    request: {
        body: {
            content: { "application/json": { schema: loginBodySchema } }
        },
    },
    responses: {
        200: {
            description: "Login success (sets refreshToken cookie)",
            headers: {
                "Set-Cookie": {
                    schema: { type: "string" },
                    description: "HTTP-only refresh token cookie"
                }
            },
            content: {
                "application/json": { schema: okEnvelopeSchema(loginResponseSchema) },
            }
        },
        400: fail400,
        401: { ...fail401, description: "Invalid Credentials" },
        500: fail500
    }
});

// POST /auth/logout (bearer)
registry.registerPath({
    method: "post",
    path: "/auth/logout",
    tags: ["Auth"],
    summary: "Logout",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: logoutBodySchema } }
        },
    },
    responses: {
        204: {
            description: "No content (clears refreshToken cookie). If cookie is missing, still returns 204",
            headers: {
                "Set-Cookie": {
                    schema: { type: "string" },
                    description: "Clears refreshToken cookie (Max-Age=0 / Expires in the past)"
                }
            },
            content: {
                "application/json": { schema: okEnvelopeSchema(refreshResponseSchema) },
            }
        },
        401: fail401,
        500: fail500
    }
})

// POST /auth/refresh (cookie)
registry.registerPath({
    method: "post",
    path: "/auth/refresh",
    tags: ["Auth"],
    summary: "Refresh access Token",
    security: [{ refreshCookie: [] }],
    request: {
        body: {
            content: { "application/json": { schema: loginBodySchema } }
        },
    },
    responses: {
        200: {
            description: "Refresh success (roates refreshToken cookie)",
            headers: {
                "Set-Cookie": {
                    schema: { type: "string" },
                    description: "HTTP-only refresh token cookie"
                }
            },
            content: {
                "application/json": { schema: okEnvelopeSchema(refreshResponseSchema) },
            }
        },
        401: { ...fail401, description: "Refresh Token missing/invalid" },
        500: fail500
    }
});

// GET /auth/me (bearer)
registry.registerPath({
    method: "get",
    path: "/auth/me",
    tags: ["Auth"],
    summary: "Get current user",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: meBodySchema } }
        },
    },
    responses: {
        200: {
            description: "OK",
            content: {
                "application/json": { schema: okEnvelopeSchema(safeUserSchema) },
            }
        },
        404: fail404,
        500: fail500
    }
});

// POST /auth/forgot-password (public)
registry.registerPath({
    method: "post",
    path: "/auth/forgot-password",
    tags: ["Auth"],
    summary: "Forgot-password",
    security: [],
    request: {
        body: {
            content: { "application/json": { schema: forgotPasswordBodySchema } }
        },
    },
    responses: {
        204: {
            description: "No content",
        },
        500: fail500
    }
});

// POST /auth/reset-password (public)
registry.registerPath({
    method: "post",
    path: "/auth/reset-password",
    tags: ["Auth"],
    summary: "Reset password",
    security: [],
    request: {
        body: {
            content: { "application/json": { schema: resetPasswordBodySchema } }
        },
    },
    responses: {
        204: {
            description: "No content"
        },
        401: { ...fail401, description: "Invalid reset token" },
        500: fail500
    }
});

// POST /auth/change-password (bearer)
registry.registerPath({
    method: "post",
    path: "/auth/change-password",
    tags: ["Auth"],
    summary: "Change password",
    security: [],
    request: {
        body: {
            content: { "application/json": { schema: changePasswordBodySchema } }
        },
    },
    responses: {
        204: {
            description: "No content"
        },
        400: { ...fail400, description: "New password must be different"},
        401: { ...fail401, description: "Invalid current password"},
        404: fail404,
        500: fail500
    }
})