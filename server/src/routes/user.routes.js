import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  getMe,
  patchMe,
  uploadAvatar,
} from "../controllers/user.controller.js";

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

export { router as userRoutes };
