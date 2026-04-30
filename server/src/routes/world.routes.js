import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listWorld,
  getTerritoryById,
  getTerritoryAtCoords,
} from "../controllers/world.controller.js";

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

export { router as worldRoutes };
