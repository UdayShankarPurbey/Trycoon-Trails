import { User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { sequelize } from "../config/db.js";
import { credit, debit } from "./economy.service.js";

const RESOURCE_KINDS = new Set(["coins", "gems", "manpower", "reputation", "xp"]);

export const banPlayer = async (admin, userId, reason) => {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound("User not found");
  if (user.id === admin.id) throw ApiError.badRequest("You cannot ban yourself");
  if (user.role === "admin") throw ApiError.forbidden("Cannot ban another admin");
  user.is_banned = true;
  user.banned_reason = (reason || "Banned by admin").slice(0, 255);
  await user.save();
  return user;
};

export const unbanPlayer = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound("User not found");
  user.is_banned = false;
  user.banned_reason = null;
  await user.save();
  return user;
};

export const grantResource = async (admin, userId, { kind, amount, reason }) => {
  if (!RESOURCE_KINDS.has(kind)) throw ApiError.badRequest(`Invalid kind: ${kind}`);
  const n = parseInt(amount, 10);
  if (!Number.isFinite(n) || n === 0) {
    throw ApiError.badRequest("amount must be a non-zero integer");
  }

  return sequelize.transaction(async (txn) => {
    const user = await User.findByPk(userId, { transaction: txn });
    if (!user) throw ApiError.notFound("User not found");

    const reasonStr = `admin_grant:${admin.username}:${reason || "no_reason"}`.slice(0, 128);

    if (n > 0) {
      await credit(user, kind, n, reasonStr, { txn });
    } else {
      await debit(user, kind, Math.abs(n), reasonStr, { txn, allowNegative: true });
    }
    return user;
  });
};

export const setPlayerRole = async (admin, userId, role) => {
  if (!["user", "admin"].includes(role)) {
    throw ApiError.badRequest("role must be 'user' or 'admin'");
  }
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound("User not found");
  if (user.id === admin.id && role === "user") {
    throw ApiError.badRequest("You cannot demote yourself");
  }
  user.role = role;
  await user.save();
  return user;
};
