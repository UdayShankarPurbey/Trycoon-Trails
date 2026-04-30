import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { battleById } from "../controllers/combat.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/battles/{id}:
 *   get:
 *     tags: [Battle]
 *     summary: Get a battle report by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Battle report }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", battleById);

export { router as battleRoutes };
