import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listBusinessTypes,
  create,
  upgrade,
  collect,
  collectAll,
} from "../controllers/business.controller.js";

const router = Router();

/**
 * @openapi
 * /api/v1/business-types:
 *   get:
 *     tags: [Business]
 *     summary: List all available business types (catalog)
 *     security: []
 *     responses:
 *       200: { description: Active business types }
 */
router.get("/types", listBusinessTypes);

router.use(authenticate);

/**
 * @openapi
 * /api/v1/businesses:
 *   post:
 *     tags: [Business]
 *     summary: Buy a new business on one of your territories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [territory_id]
 *             properties:
 *               territory_id: { type: string, format: uuid }
 *               type_id:   { type: integer, description: "Business type id" }
 *               type_code: { type: string, description: "Or use code: farm | shop | factory | bank | tech_lab" }
 *     responses:
 *       201: { description: Business bought }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/", create);

/**
 * @openapi
 * /api/v1/businesses/{id}/upgrade:
 *   patch:
 *     tags: [Business]
 *     summary: Upgrade a business by 1 level
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Upgraded }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:id/upgrade", upgrade);

/**
 * @openapi
 * /api/v1/businesses/{id}/collect:
 *   post:
 *     tags: [Business]
 *     summary: Collect uncollected income from a single business
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Income collected }
 */
router.post("/:id/collect", collect);

/**
 * @openapi
 * /api/v1/businesses/collect-all:
 *   post:
 *     tags: [Business]
 *     summary: Collect uncollected income from all of my businesses
 *     responses:
 *       200: { description: Income collected }
 */
router.post("/collect-all", collectAll);

export { router as businessRoutes };
