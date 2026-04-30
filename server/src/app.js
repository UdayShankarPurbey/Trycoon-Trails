import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { sequelize } from "./config/db.js";
import { redis } from "./config/redis.js";
import { logger, morganStream } from "./utils/logger.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(helmet());
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

app.get("/", (_req, res) => {
  res.json(new ApiResponse(200, { name: "Trycoon Trails API", version: "0.1.0" }, "Welcome"));
});

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
