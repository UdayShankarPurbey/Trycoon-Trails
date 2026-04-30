import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { list, claim } from "../controllers/mission.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/missions:
 *   get:
 *     tags: [Mission]
 *     summary: List missions visible to me + my progress on each
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [daily, story, achievement] }
 *     responses:
 *       200: { description: Missions with progress }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/", list);

/**
 * @openapi
 * /api/v1/missions/{id}/claim:
 *   post:
 *     tags: [Mission]
 *     summary: Claim the reward for a completed mission
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Reward claimed }
 *       400: { description: Not completed / already claimed / not started }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/claim", claim);

export { router as missionRoutes };
