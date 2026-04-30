import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import * as A from "../controllers/admin.controller.js";

const router = Router();

router.use(authenticate, requireAdmin);

/**
 * @openapi
 * tags:
 *   - name: Admin
 *     description: Admin-only catalog management & moderation. All actions are audit-logged.
 */

/**
 * @openapi
 * /api/v1/admin/levels:
 *   get:
 *     tags: [Admin]
 *     summary: List all levels
 *     responses:
 *       200: { description: Levels list }
 */
router.get("/levels", A.listLevels);
/**
 * @openapi
 * /api/v1/admin/levels/{level}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a level (title, xp_required, rewards, unlocks)
 *     parameters:
 *       - { in: path, name: level, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Updated }
 */
router.patch("/levels/:level", A.updateLevel);

/**
 * @openapi
 * /api/v1/admin/business-types:
 *   get: { tags: [Admin], summary: List all business types, responses: { 200: { description: List } } }
 *   post: { tags: [Admin], summary: Create a business type, responses: { 201: { description: Created } } }
 */
router.get("/business-types", A.listBusinessTypes);
router.post("/business-types", A.createBusinessType);
/**
 * @openapi
 * /api/v1/admin/business-types/{id}:
 *   patch: { tags: [Admin], summary: Update business type, parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: Updated } } }
 *   delete: { tags: [Admin], summary: Deactivate business type (soft delete), parameters: [{ in: path, name: id, required: true, schema: { type: integer } }], responses: { 200: { description: Deactivated } } }
 */
router.patch("/business-types/:id", A.updateBusinessType);
router.delete("/business-types/:id", A.deleteBusinessType);

/**
 * @openapi
 * /api/v1/admin/unit-types:
 *   get: { tags: [Admin], summary: List all unit types, responses: { 200: { description: List } } }
 *   post: { tags: [Admin], summary: Create unit type, responses: { 201: { description: Created } } }
 */
router.get("/unit-types", A.listUnitTypes);
router.post("/unit-types", A.createUnitType);
router.patch("/unit-types/:id", A.updateUnitType);
router.delete("/unit-types/:id", A.deleteUnitType);

/**
 * @openapi
 * /api/v1/admin/missions:
 *   get: { tags: [Admin], summary: List all missions (active + inactive), responses: { 200: { description: List } } }
 *   post: { tags: [Admin], summary: Create mission, responses: { 201: { description: Created } } }
 */
router.get("/missions", A.listMissions);
router.post("/missions", A.createMission);
router.patch("/missions/:id", A.updateMission);
router.delete("/missions/:id", A.deleteMission);

/**
 * @openapi
 * /api/v1/admin/territories:
 *   get:
 *     tags: [Admin]
 *     summary: List territories (paginated, filterable)
 *     parameters:
 *       - { in: query, name: limit, schema: { type: integer, default: 100, maximum: 500 } }
 *       - { in: query, name: offset, schema: { type: integer } }
 *       - { in: query, name: has_owner, schema: { type: string, enum: [true, false] } }
 *     responses:
 *       200: { description: Territories }
 */
router.get("/territories", A.listTerritories);
router.patch("/territories/:id", A.updateTerritory);
/**
 * @openapi
 * /api/v1/admin/territories/{id}/clear:
 *   post:
 *     tags: [Admin]
 *     summary: Clear territory ownership (force-unown)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Cleared }
 */
router.post("/territories/:id/clear", A.clearTerritoryOwnership);

/**
 * @openapi
 * /api/v1/admin/players:
 *   get:
 *     tags: [Admin]
 *     summary: List players (paginated, searchable)
 *     parameters:
 *       - { in: query, name: q, schema: { type: string }, description: "Search username or email" }
 *       - { in: query, name: role, schema: { type: string, enum: [user, admin] } }
 *       - { in: query, name: is_banned, schema: { type: string, enum: [true, false] } }
 *       - { in: query, name: limit, schema: { type: integer, default: 50 } }
 *       - { in: query, name: offset, schema: { type: integer } }
 *     responses:
 *       200: { description: Player list }
 */
router.get("/players", A.listPlayers);

/**
 * @openapi
 * /api/v1/admin/players/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get player detail (with territories)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Player detail }
 */
router.get("/players/:id", A.getPlayer);

/**
 * @openapi
 * /api/v1/admin/players/{id}/ban:
 *   post:
 *     tags: [Admin]
 *     summary: Ban a player
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: { reason: { type: string } }
 *     responses:
 *       200: { description: Banned }
 */
router.post("/players/:id/ban", A.banUser);

/**
 * @openapi
 * /api/v1/admin/players/{id}/unban:
 *   post:
 *     tags: [Admin]
 *     summary: Unban a player
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Unbanned }
 */
router.post("/players/:id/unban", A.unbanUser);

/**
 * @openapi
 * /api/v1/admin/players/{id}/grant:
 *   post:
 *     tags: [Admin]
 *     summary: Grant (or remove) a resource to/from a player
 *     description: |
 *       `kind`: coins | gems | manpower | reputation | xp.
 *       Positive `amount` credits, negative debits. Logged in transactions and audit log.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kind, amount]
 *             properties:
 *               kind: { type: string, enum: [coins, gems, manpower, reputation, xp] }
 *               amount: { type: integer }
 *               reason: { type: string }
 *     responses:
 *       200: { description: Granted }
 */
router.post("/players/:id/grant", A.grantToPlayer);

/**
 * @openapi
 * /api/v1/admin/players/{id}/role:
 *   post:
 *     tags: [Admin]
 *     summary: Promote / demote a player
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       200: { description: Role updated }
 */
router.post("/players/:id/role", A.updatePlayerRole);

/**
 * @openapi
 * /api/v1/admin/audit-log:
 *   get:
 *     tags: [Admin]
 *     summary: Audit log of all admin actions
 *     parameters:
 *       - { in: query, name: admin_id, schema: { type: string, format: uuid } }
 *       - { in: query, name: action, schema: { type: string } }
 *       - { in: query, name: target_table, schema: { type: string } }
 *       - { in: query, name: limit, schema: { type: integer, default: 50 } }
 *       - { in: query, name: offset, schema: { type: integer } }
 *     responses:
 *       200: { description: Audit entries }
 */
router.get("/audit-log", A.listAuditLog);

export { router as adminRoutes };
