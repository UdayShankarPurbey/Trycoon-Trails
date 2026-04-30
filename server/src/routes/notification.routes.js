import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  list,
  unread,
  markOneRead,
  markAllUserRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     tags: [Notification]
 *     summary: List my notifications
 *     parameters:
 *       - { in: query, name: limit, schema: { type: integer, default: 50 } }
 *       - { in: query, name: offset, schema: { type: integer, default: 0 } }
 *       - { in: query, name: unread, schema: { type: string, enum: [true, false] } }
 *     responses:
 *       200: { description: Notifications list }
 */
router.get("/", list);

/**
 * @openapi
 * /api/v1/notifications/unread-count:
 *   get:
 *     tags: [Notification]
 *     summary: Get count of unread notifications
 *     responses:
 *       200: { description: Unread count }
 */
router.get("/unread-count", unread);

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   post:
 *     tags: [Notification]
 *     summary: Mark a notification as read
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Marked as read }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/read", markOneRead);

/**
 * @openapi
 * /api/v1/notifications/read-all:
 *   post:
 *     tags: [Notification]
 *     summary: Mark all my notifications as read
 *     responses:
 *       200: { description: All marked as read }
 */
router.post("/read-all", markAllUserRead);

export { router as notificationRoutes };
