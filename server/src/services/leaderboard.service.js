import { redis } from "../config/redis.js";
import { User, Battle } from "../models/index.js";
import { Op } from "sequelize";
import { logger } from "../utils/logger.js";

const KIND_KEY = (kind) => `lb:${kind}`;
const VALID_KINDS = new Set(["coins", "gems", "xp", "level", "reputation", "battles_won"]);

export const updateScore = async (userId, kind, score) => {
  if (!VALID_KINDS.has(kind)) return;
  try {
    await redis.zadd(KIND_KEY(kind), Number(score), userId);
  } catch (err) {
    logger.error(`Leaderboard update failed (${kind}): ${err.message}`);
  }
};

export const incrementScore = async (userId, kind, delta = 1) => {
  if (!VALID_KINDS.has(kind)) return;
  try {
    await redis.zincrby(KIND_KEY(kind), delta, userId);
  } catch (err) {
    logger.error(`Leaderboard increment failed (${kind}): ${err.message}`);
  }
};

export const getTop = async (kind, { limit = 10, offset = 0 } = {}) => {
  if (!VALID_KINDS.has(kind)) return [];

  const raw = await redis.zrevrange(KIND_KEY(kind), offset, offset + limit - 1, "WITHSCORES");
  if (raw.length === 0) return [];

  const entries = [];
  for (let i = 0; i < raw.length; i += 2) {
    entries.push({ userId: raw[i], score: Number(raw[i + 1]) });
  }

  const userIds = entries.map((e) => e.userId);
  const users = await User.findAll({
    where: { id: { [Op.in]: userIds } },
    attributes: ["id", "username", "level", "avatar_url"],
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return entries.map((e, i) => {
    const u = byId.get(e.userId);
    return {
      rank: offset + i + 1,
      user_id: e.userId,
      username: u?.username ?? "(deleted)",
      level: u?.level ?? null,
      avatar_url: u?.avatar_url ?? null,
      score: e.score,
    };
  });
};

export const getUserRank = async (userId, kind) => {
  if (!VALID_KINDS.has(kind)) return null;
  const rank = await redis.zrevrank(KIND_KEY(kind), userId);
  if (rank === null) return null;
  const score = await redis.zscore(KIND_KEY(kind), userId);
  return { rank: rank + 1, score: Number(score) };
};

export const rebuildAll = async () => {
  const all = await User.findAll({ attributes: ["id", "coins", "gems", "xp", "level", "reputation"] });
  const pipe = redis.multi();
  pipe.del(KIND_KEY("coins"), KIND_KEY("gems"), KIND_KEY("xp"), KIND_KEY("level"), KIND_KEY("reputation"));
  for (const u of all) {
    pipe.zadd(KIND_KEY("coins"), Number(u.coins), u.id);
    pipe.zadd(KIND_KEY("gems"), Number(u.gems), u.id);
    pipe.zadd(KIND_KEY("xp"), Number(u.xp), u.id);
    pipe.zadd(KIND_KEY("level"), Number(u.level), u.id);
    pipe.zadd(KIND_KEY("reputation"), Number(u.reputation), u.id);
  }

  const battleStats = await Battle.findAll({
    attributes: [
      "winner_id",
      [Battle.sequelize.fn("COUNT", "*"), "wins"],
    ],
    where: { winner_id: { [Op.ne]: null } },
    group: ["winner_id"],
    raw: true,
  });
  pipe.del(KIND_KEY("battles_won"));
  for (const row of battleStats) {
    pipe.zadd(KIND_KEY("battles_won"), Number(row.wins), row.winner_id);
  }

  await pipe.exec();
  logger.info(
    `Leaderboards rebuilt: ${all.length} users, ${battleStats.length} battle winners`
  );
};
