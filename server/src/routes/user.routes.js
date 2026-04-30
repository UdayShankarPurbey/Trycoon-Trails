import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  getMe,
  patchMe,
  uploadAvatar,
} from "../controllers/user.controller.js";
import { claim as claimDailyReward } from "../controllers/dailyReward.controller.js";
import { listMyTransactions } from "../controllers/transaction.controller.js";
import { getMyTerritories } from "../controllers/world.controller.js";
import { myBusinesses } from "../controllers/business.controller.js";
import { myArmy } from "../controllers/army.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     tags: [User]
 *     summary: Get my profile
 *     responses:
 *       200: { description: My profile }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me", getMe);

/**
 * @openapi
 * /api/v1/users/me:
 *   patch:
 *     tags: [User]
 *     summary: Update my profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *     responses:
 *       200: { description: Profile updated }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       422: { $ref: '#/components/responses/BadRequest' }
 */
router.patch("/me", patchMe);

/**
 * @openapi
 * /api/v1/users/me/avatar:
 *   post:
 *     tags: [User]
 *     summary: Upload or replace my avatar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Avatar updated }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/me/avatar", upload.single("avatar"), uploadAvatar);

/**
 * @openapi
 * /api/v1/users/me/daily-reward:
 *   post:
 *     tags: [User]
 *     summary: Claim today's login-streak reward
 *     description: Awards coins/gems/XP based on current streak day. Streak resets if last claim was >48h ago. Cooldown 20h between claims.
 *     responses:
 *       200: { description: Reward claimed }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       429: { description: "Already claimed today" }
 */
router.post("/me/daily-reward", claimDailyReward);

/**
 * @openapi
 * /api/v1/users/me/transactions:
 *   get:
 *     tags: [User]
 *     summary: List my resource-transaction history
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: kind
 *         schema: { type: string, enum: [coins, gems, manpower, reputation, xp] }
 *     responses:
 *       200: { description: Paginated transactions }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me/transactions", listMyTransactions);

/**
 * @openapi
 * /api/v1/users/me/territories:
 *   get:
 *     tags: [User, World]
 *     summary: List all territories owned by me
 *     responses:
 *       200: { description: My territories }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me/territories", getMyTerritories);

/**
 * @openapi
 * /api/v1/users/me/businesses:
 *   get:
 *     tags: [User, Business]
 *     summary: List all my businesses with current income / upgrade cost
 *     responses:
 *       200: { description: My businesses with income breakdown }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me/businesses", myBusinesses);

/**
 * @openapi
 * /api/v1/users/me/army:
 *   get:
 *     tags: [User, Army]
 *     summary: Summary of my army (per-territory groups, manpower, total strength)
 *     responses:
 *       200: { description: My army }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me/army", myArmy);

export { router as userRoutes };
