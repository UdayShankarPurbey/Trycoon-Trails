import { Op } from "sequelize";
import { Notification } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export const createNotification = async ({ userId, type, title, body = null, data = null }, { txn = null } = {}) => {
  if (!userId) return null;
  try {
    return await Notification.create(
      { user_id: userId, type, title, body, data },
      { transaction: txn }
    );
  } catch (err) {
    logger.error(`Notification create failed: ${err.message}`);
    return null;
  }
};

export const listForUser = async (userId, { limit = 50, offset = 0, unreadOnly = false } = {}) => {
  const where = { user_id: userId };
  if (unreadOnly) where.is_read = false;
  return Notification.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });
};

export const unreadCount = async (userId) => {
  return Notification.count({ where: { user_id: userId, is_read: false } });
};

export const markRead = async (userId, id) => {
  const n = await Notification.findOne({ where: { id, user_id: userId } });
  if (!n) throw ApiError.notFound("Notification not found");
  if (!n.is_read) {
    n.is_read = true;
    n.read_at = new Date();
    await n.save();
  }
  return n;
};

export const markAllRead = async (userId) => {
  const [count] = await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { user_id: userId, is_read: false } }
  );
  return count;
};

export const deleteOlderThan = async (userId, days = 30) => {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return Notification.destroy({
    where: { user_id: userId, is_read: true, created_at: { [Op.lt]: cutoff } },
  });
};
