import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const definition = {
  openapi: "3.0.3",
  info: {
    title: "Trycoon Trails API",
    version: "0.1.0",
    description:
      "Backend API for Trycoon Trails — async-multiplayer tycoon/strategy game.",
    contact: { name: "Trycoon Trails Team" },
  },
  servers: [
    {
      url: `http://localhost:${env.port}`,
      description: "Local development",
    },
  ],
  tags: [
    { name: "Health", description: "Service health & meta endpoints" },
    { name: "Auth", description: "Signup, login, token refresh" },
    { name: "User", description: "Player profile & resources" },
    { name: "World", description: "Territories & world map" },
    { name: "Business", description: "Buy and upgrade businesses" },
    { name: "Army", description: "Recruit and manage units" },
    { name: "Battle", description: "Attack and capture territories" },
    { name: "Mission", description: "Daily/story/achievement missions" },
    { name: "Admin", description: "Admin-only catalog & moderation" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
      },
    },
    schemas: {
      ApiSuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          statusCode: { type: "integer", example: 200 },
          message: { type: "string", example: "Success" },
          data: { type: "object", nullable: true },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          statusCode: { type: "integer", example: 400 },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      HealthCheck: {
        type: "object",
        properties: {
          server: { type: "string", example: "ok" },
          db: { type: "string", example: "ok" },
          redis: { type: "string", example: "ok" },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Invalid request payload",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      Unauthorized: {
        description: "Missing or invalid authentication",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      Forbidden: {
        description: "Authenticated but not allowed",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      ServerError: {
        description: "Server-side failure",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const apis = [
  path.resolve(__dirname, "../routes/*.js"),
  path.resolve(__dirname, "../controllers/*.js"),
  path.resolve(__dirname, "../app.js"),
];

export const swaggerSpec = swaggerJsdoc({ definition, apis });
