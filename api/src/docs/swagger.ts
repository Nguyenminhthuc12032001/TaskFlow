import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { generateOpenAPIDocument } from "./openapi.js";
import "./registerPath.js"

export function setupSwagger(app: Express) {
    const openapiDocument = generateOpenAPIDocument();

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
}