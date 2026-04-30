import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { sequelize } from "./config/db.js";
import { redis } from "./config/redis.js";
import { swaggerSpec } from "./config/swagger.js";
import { logger, morganStream } from "./utils/logger.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(
  morgan(env.isProd ? "combined" : "dev", { stream: morganStream })
);

app.use(
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Trycoon Trails API Docs",
    swaggerOptions: { persistAuthorization: true, docExpansion: "none" },
  })
);

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns the status of the API server, MySQL, and Redis. Returns 503 if any dependency is down.
 *     security: []
 *     responses:
 *       200:
 *         description: All systems healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: One or more dependencies are degraded
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HealthCheck'
 */
app.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const checks = { server: "ok", db: "unknown", redis: "unknown" };

    try {
      await sequelize.authenticate();
      checks.db = "ok";
    } catch {
      checks.db = "down";
    }

    try {
      const pong = await redis.ping();
      checks.redis = pong === "PONG" ? "ok" : "down";
    } catch {
      checks.redis = "down";
    }

    const allHealthy = Object.values(checks).every((v) => v === "ok");
    res
      .status(allHealthy ? 200 : 503)
      .json(new ApiResponse(allHealthy ? 200 : 503, checks, allHealthy ? "Healthy" : "Degraded"));
  })
);

/**
 * @openapi
 * /:
 *   get:
 *     tags: [Health]
 *     summary: API root
 *     description: Returns basic API metadata.
 *     security: []
 *     responses:
 *       200:
 *         description: API metadata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
app.get("/", (_req, res) => {
  res.json(new ApiResponse(200, { name: "Trycoon Trails API", version: "0.1.0", docs: "/api-docs" }, "Welcome"));
});

app.use(notFoundHandler);
app.use(errorHandler);

logger.debug("Express app initialized — Swagger UI at /api-docs");

export { app };
