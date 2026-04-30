import http from "http";

import { env } from "./config/env.js";
import { app } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { logger } from "./utils/logger.js";

let server;

const start = async () => {
  try {
    await connectDB();
    await connectRedis();

    server = http.createServer(app);

    server.listen(env.port, () => {
      logger.info(`Trycoon Trails API listening on http://localhost:${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    logger.info("HTTP server closed");
  }

  await disconnectDB();
  await disconnectRedis();

  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
  shutdown("uncaughtException");
});

start();
