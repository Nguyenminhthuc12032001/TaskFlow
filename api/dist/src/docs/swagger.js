import swaggerUi from "swagger-ui-express";
import { generateOpenAPIDocument } from "./openapi.js";
export function setupSwagger(app) {
    const openapiDocument = generateOpenAPIDocument();
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
}
