import { Router } from "express";
import {
  signup,
  login,
  refresh,
  logout,
  me,
  changePassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @openapi
 * /api/v1/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a player account with starter resources and a 7-day shield. Returns access + refresh tokens (also set as httpOnly cookies).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string, example: "uday" }
 *               email:    { type: string, example: "uday@example.com" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       201: { description: User created, content: { application/json: { schema: { $ref: '#/components/schemas/ApiSuccess' } } } }
 *       409: { $ref: '#/components/responses/BadRequest' }
 *       422: { $ref: '#/components/responses/BadRequest' }
 */
router.post("/signup", signup);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with username or email + password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier: { type: string, description: "Username or email", example: "uday" }
 *               password:   { type: string, example: "password123" }
 *     responses:
 *       200: { description: Login successful, content: { application/json: { schema: { $ref: '#/components/schemas/ApiSuccess' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/login", login);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate the access token using the refresh token
 *     description: Reads refresh token from cookie or body. Old refresh token is revoked; a new pair is issued.
 *     security: []
 *     responses:
 *       200: { description: Token refreshed }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/refresh", refresh);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the refresh token and clear cookies
 *     security: []
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", logout);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     responses:
 *       200: { description: Current user }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me", authenticate, me);

/**
 * @openapi
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change the authenticated user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string }
 *     responses:
 *       200: { description: Password changed }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       422: { $ref: '#/components/responses/BadRequest' }
 */
router.post("/change-password", authenticate, changePassword);

export { router as authRoutes };
