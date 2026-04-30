import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { top, myRank } from "../controllers/leaderboard.controller.js";

const router = Router();

/**
 * @openapi
 * /api/v1/leaderboards/{kind}:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Top players by a metric
 *     description: "kind: coins | gems | xp | level | reputation | battles_won"
 *     parameters:
 *       - { in: path, name: kind, required: true, schema: { type: string } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10, maximum: 100 } }
 *       - { in: query, name: offset, schema: { type: integer, default: 0 } }
 *     security: []
 *     responses:
 *       200: { description: Leaderboard }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
router.get("/:kind", top);

/**
 * @openapi
 * /api/v1/leaderboards/{kind}/me:
 *   get:
 *     tags: [Leaderboard]
 *     summary: My rank in a leaderboard
 *     parameters:
 *       - { in: path, name: kind, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: My rank }
 */
router.get("/:kind/me", authenticate, myRank);

export { router as leaderboardRoutes };
