import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listUnitTypes,
  recruit,
  disband,
} from "../controllers/army.controller.js";

const router = Router();

/**
 * @openapi
 * /api/v1/army/types:
 *   get:
 *     tags: [Army]
 *     summary: List unit types (catalog)
 *     security: []
 *     responses:
 *       200: { description: All unit types }
 */
router.get("/types", listUnitTypes);

router.use(authenticate);

/**
 * @openapi
 * /api/v1/army/recruit:
 *   post:
 *     tags: [Army]
 *     summary: Recruit units onto one of your territories
 *     description: Costs coins + manpower. Player level must meet unit's unlock_level.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [territory_id, count]
 *             properties:
 *               territory_id: { type: string, format: uuid }
 *               unit_type_id: { type: integer }
 *               unit_code:    { type: string, example: "guard" }
 *               count:        { type: integer, minimum: 1, maximum: 1000 }
 *     responses:
 *       201: { description: Recruited }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/recruit", recruit);

/**
 * @openapi
 * /api/v1/army/{id}/disband:
 *   post:
 *     tags: [Army]
 *     summary: Disband (remove) units from an army group
 *     description: Refunds 50% of manpower spent. Coin cost is not refunded.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid, description: "Army group id" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [count]
 *             properties:
 *               count: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Disbanded }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/disband", disband);

export { router as armyRoutes };
