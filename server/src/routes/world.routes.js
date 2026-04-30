import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listWorld,
  getTerritoryById,
  getTerritoryAtCoords,
} from "../controllers/world.controller.js";
import { scout, attack } from "../controllers/combat.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/world:
 *   get:
 *     tags: [World]
 *     summary: List world tiles (paginated, filterable)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100, maximum: 500 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: x_min
 *         schema: { type: integer }
 *       - in: query
 *         name: x_max
 *         schema: { type: integer }
 *       - in: query
 *         name: y_min
 *         schema: { type: integer }
 *       - in: query
 *         name: y_max
 *         schema: { type: integer }
 *       - in: query
 *         name: owner_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: has_owner
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: terrain
 *         schema: { type: string, enum: [plains, forest, mountain, coast, desert] }
 *     responses:
 *       200: { description: World tiles }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/", listWorld);

/**
 * @openapi
 * /api/v1/world/at/{x}/{y}:
 *   get:
 *     tags: [World]
 *     summary: Get the tile at a coordinate
 *     parameters:
 *       - in: path
 *         name: x
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: y
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Tile data }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/at/:x/:y", getTerritoryAtCoords);

/**
 * @openapi
 * /api/v1/world/{id}:
 *   get:
 *     tags: [World]
 *     summary: Get a tile by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Tile data }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", getTerritoryById);

/**
 * @openapi
 * /api/v1/world/{id}/scout:
 *   post:
 *     tags: [Battle, World]
 *     summary: Scout an enemy territory (level 6+, costs 50 coins)
 *     description: Reveals the defender's army composition without attacking.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Scout report }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/scout", scout);

/**
 * @openapi
 * /api/v1/world/{id}/attack:
 *   post:
 *     tags: [Battle, World]
 *     summary: Attack a territory (level 7+; capture requires level 8)
 *     description: |
 *       Sends specified units from your armies. Combat is resolved instantly.
 *       If you win and are level 8+, you capture the territory (and damage businesses).
 *       If you win at level 7, the territory enters cooldown but isn't transferred.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [units]
 *             properties:
 *               units:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [army_id, count]
 *                   properties:
 *                     army_id: { type: string, format: uuid }
 *                     count:   { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Battle report }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/attack", attack);

export { router as worldRoutes };
