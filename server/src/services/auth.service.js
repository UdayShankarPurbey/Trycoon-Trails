import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import ms from "ms";

import { User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { sequelize } from "../config/db.js";
import { spawnStarterTerritory } from "./world.service.js";

const REFRESH_KEY = (userId, jti) => `refresh:${userId}:${jti}`;

const refreshTtlSeconds = () => {
  try {
    return Math.floor(ms(env.jwt.refreshExpiry) / 1000);
  } catch {
    return 7 * 24 * 60 * 60;
  }
};

const storeRefreshToken = async (userId, jti) => {
  await redis.set(REFRESH_KEY(userId, jti), "1", "EX", refreshTtlSeconds());
};

const revokeRefreshToken = async (userId, jti) => {
  await redis.del(REFRESH_KEY(userId, jti));
};

const isRefreshTokenActive = async (userId, jti) => {
  const v = await redis.get(REFRESH_KEY(userId, jti));
  return v === "1";
};

export const signupService = async ({ username, email, password }) => {
  const existing = await User.findOne({
    where: { [Op.or]: [{ username }, { email }] },
  });
  if (existing) {
    if (existing.username === username) throw ApiError.conflict("Username already taken");
    throw ApiError.conflict("Email already registered");
  }

  const password_hash = await bcrypt.hash(password, 10);
  const shieldDays = env.starter.shieldDays;
  const shield_until = new Date(Date.now() + shieldDays * 24 * 60 * 60 * 1000);

  const { user, territory } = await sequelize.transaction(async (txn) => {
    const u = await User.create(
      {
        username,
        email,
        password_hash,
        role: "user",
        level: 1,
        xp: 0,
        coins: env.starter.coins,
        gems: env.starter.gems,
        manpower: env.starter.manpower,
        reputation: 0,
        shield_until,
        last_active_at: new Date(),
      },
      { transaction: txn }
    );
    const t = await spawnStarterTerritory(u, { txn });
    return { user: u, territory: t };
  });

  logger.info(`New user signup: ${user.username} (${user.id}) at tile (${territory.x},${territory.y})`);
  return { user, territory };
};

export const loginService = async ({ identifier, password }) => {
  const user = await User.findOne({
    where: { [Op.or]: [{ username: identifier }, { email: identifier }] },
  });
  if (!user) throw ApiError.unauthorized("Invalid credentials");
  if (user.is_banned) throw ApiError.forbidden(user.banned_reason || "Account is banned");

  const ok = await user.checkPassword(password);
  if (!ok) throw ApiError.unauthorized("Invalid credentials");

  user.last_active_at = new Date();
  await user.save();

  return issueTokens(user);
};

export const issueTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const { token: refreshToken, jti } = signRefreshToken(user);
  await storeRefreshToken(user.id, jti);
  return { user, accessToken, refreshToken };
};

export const refreshService = async (refreshToken) => {
  if (!refreshToken) throw ApiError.unauthorized("Missing refresh token");

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const active = await isRefreshTokenActive(payload.sub, payload.jti);
  if (!active) throw ApiError.unauthorized("Refresh token revoked");

  const user = await User.findByPk(payload.sub);
  if (!user) throw ApiError.unauthorized("User not found");
  if (user.is_banned) throw ApiError.forbidden(user.banned_reason || "Account is banned");

  await revokeRefreshToken(payload.sub, payload.jti);
  return issueTokens(user);
};

export const logoutService = async (refreshToken) => {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await revokeRefreshToken(payload.sub, payload.jti);
  } catch {
    /* ignore — already invalid */
  }
};

export const changePasswordService = async (user, { currentPassword, newPassword }) => {
  const ok = await user.checkPassword(currentPassword);
  if (!ok) throw ApiError.unauthorized("Current password is incorrect");

  user.password_hash = await bcrypt.hash(newPassword, 10);
  await user.save();
};
