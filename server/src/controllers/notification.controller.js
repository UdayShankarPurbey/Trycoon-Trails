import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  listForUser,
  unreadCount,
  markRead,
  markAllRead,
} from "../services/notification.service.js";

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const list = asyncHandler(async (req, res) => {
  const limit = Math.min(toInt(req.query.limit, 50), 200);
  const offset = toInt(req.query.offset, 0);
  const unreadOnly = req.query.unread === "true";

  const { rows, count } = await listForUser(req.user.id, { limit, offset, unreadOnly });
  res.status(200).json(
    new ApiResponse(200, { total: count, limit, offset, items: rows }, "OK")
  );
});

export const unread = asyncHandler(async (req, res) => {
  const count = await unreadCount(req.user.id);
  res.status(200).json(new ApiResponse(200, { unread: count }, "OK"));
});

export const markOneRead = asyncHandler(async (req, res) => {
  const n = await markRead(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, n, "Marked as read"));
});

export const markAllUserRead = asyncHandler(async (req, res) => {
  const count = await markAllRead(req.user.id);
  res.status(200).json(new ApiResponse(200, { marked: count }, `${count} notifications marked as read`));
});
