import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { ApiError, globalErrorHandler } from "../src/middlewares/errorHandler.js";

function createErrorApp(error: unknown) {
  const app = express();
  app.get("/error", (_req, _res, next) => next(error));
  app.use(globalErrorHandler);
  return app;
}

describe("global error handler", () => {
  it("serializes ApiError status and message", async () => {
    const response = await request(createErrorApp(new ApiError(418, "teapot"))).get("/error");
    expect(response.status).toBe(418);
    expect(response.body).toMatchObject({ success: false, error: "teapot" });
  });

  it("falls back to HTTP 500 for unknown errors", async () => {
    const response = await request(createErrorApp(new Error("unexpected"))).get("/error");
    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({ success: false, error: "unexpected" });
  });
});