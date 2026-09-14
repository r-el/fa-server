import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

const registry = new OpenAPIRegistry();
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

registry.registerPath({
  method: "get",
  path: "/health",
  summary: "Check server health",
  responses: { 200: { description: "Server is healthy" } },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  summary: "Authenticate a user",
  responses: {
    200: { description: "Login successful" },
    401: { description: "Invalid credentials" },
  },
});

export function setupSwagger(app: Express): void {
  const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "FaceAlert Backend API",
      description: "API for FaceAlert Dashboard and Services",
    },
    servers: [{ url: "/" }],
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(document));
  app.get("/api-docs.json", (_req, res) => res.json(document));
}

export { registry };
