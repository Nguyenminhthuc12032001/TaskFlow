import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
export const registry = new OpenAPIRegistry();
registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
});
registry.registerComponent("securitySchemes", "csrfToken", {
    type: "apiKey",
    in: "header",
    name: "x-csrf-token",
});
export function generateOpenAPIDocument() {
    const generator = new OpenApiGeneratorV3(registry.definitions);
    return generator.generateDocument({
        openapi: "3.0.0",
        info: {
            title: "TaskFlow API",
            version: "1.0.0",
            description: "TaskFlow backend API docs"
        },
        servers: [
            { url: "http://localhost:4000" }
        ],
        security: [{ bearerAuth: [] }]
    });
}
