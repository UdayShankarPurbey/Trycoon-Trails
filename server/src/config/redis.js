import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redis.on("error", (err) => {
  logger.error(`Redis error: ${err.message}`);
});

redis.on("reconnecting", () => {
  logger.warn("Redis reconnecting...");
});

export const connectRedis = async () => {
  try {
    await redis.connect();
    await redis.ping();
    logger.info(`Redis connected: ${env.redis.host}:${env.redis.port}`);
  } catch (err) {
    logger.error(`Redis connection failed: ${err.message}`);
    throw err;
  }
};

export const disconnectRedis = async () => {
  try {
    await redis.quit();
    logger.info("Redis disconnected");
  } catch (err) {
    logger.error(`Redis disconnect error: ${err.message}`);
  }
};
