import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { listLevels, myLevelInfo } from "../controllers/level.controller.js";

const router = Router();

/**
 * @openapi
 * /api/v1/levels:
 *   get:
 *     tags: [Level]
 *     summary: List all levels in the catalog
 *     security: []
 *     responses:
 *       200: { description: All levels }
 */
router.get("/", listLevels);

/**
 * @openapi
 * /api/v1/levels/me:
 *   get:
 *     tags: [Level]
 *     summary: Get my current level + progress to next
 *     responses:
 *       200: { description: Level info }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me", authenticate, myLevelInfo);

export { router as levelRoutes };
