import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const required = [
  "NODE_ENV",
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_NAME",
  "REDIS_HOST",
  "REDIS_PORT",
  "JWT_ACCESS_SECRET",
  "JWT_ACCESS_EXPIRY",
  "JWT_REFRESH_SECRET",
  "JWT_REFRESH_EXPIRY",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `\n[env] Missing required environment variables: ${missing.join(", ")}\n` +
      `Copy .env.example to .env and fill in the values.\n`
  );
  process.exit(1);
}

const toInt = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV,
  isProd: process.env.NODE_ENV === "production",
  isDev: process.env.NODE_ENV === "development",
  port: toInt(process.env.PORT, 8000),
  corsOrigin: process.env.CORS_ORIGIN || "*",

  db: {
    host: process.env.DB_HOST,
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME,
    dialect: process.env.DB_DIALECT || "mysql",
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: toInt(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  logLevel: process.env.LOG_LEVEL || "info",

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 200),
  },
});
