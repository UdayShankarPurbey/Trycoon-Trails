import { Level } from "../models/index.js";
import { credit } from "./economy.service.js";
import { recordEvent } from "./mission.service.js";
import { updateScore } from "./leaderboard.service.js";
import { createNotification } from "./notification.service.js";
import { logger } from "../utils/logger.js";

const getOrderedLevels = async () => {
  return Level.findAll({ order: [["level", "ASC"]] });
};

export const awardXp = async (user, amount, reason, { txn = null } = {}) => {
  if (amount <= 0) return { user, levelUps: [] };

  await credit(user, "xp", amount, reason, { txn });

  const levels = await getOrderedLevels();
  const levelUps = [];

  while (true) {
    const next = levels.find((l) => l.level === user.level + 1);
    if (!next) break;
    if (Number(user.xp) < next.xp_required) break;

    user.level = next.level;
    await user.save({ transaction: txn });

    if (next.reward_coins > 0) {
      await credit(user, "coins", next.reward_coins, `level_up_${next.level}`, { txn });
    }
    if (next.reward_gems > 0) {
      await credit(user, "gems", next.reward_gems, `level_up_${next.level}`, { txn });
    }

    levelUps.push({
      level: next.level,
      title: next.title,
      reward_coins: next.reward_coins,
      reward_gems: next.reward_gems,
      unlocks: next.unlocks,
    });
    logger.info(`User ${user.username} leveled up to ${next.level} (${next.title})`);
  }

  if (levelUps.length > 0) {
    await recordEvent(user, "reach_level", user.level, { mode: "max", txn });
    updateScore(user.id, "level", user.level).catch(() => {});
    for (const lu of levelUps) {
      await createNotification(
        {
          userId: user.id,
          type: "level_up",
          title: `Leveled up to ${lu.level}: ${lu.title}`,
          body: `You reached level ${lu.level} (${lu.title}). Rewards: ${lu.reward_coins} coins, ${lu.reward_gems} gems.`,
          data: { level: lu.level, title: lu.title, unlocks: lu.unlocks },
        },
        { txn }
      );
    }
  }

  return { user, levelUps };
};

export const getLevelInfo = async (user) => {
  const levels = await getOrderedLevels();
  const current = levels.find((l) => l.level === user.level);
  const next = levels.find((l) => l.level === user.level + 1);

  const xp = Number(user.xp);
  const xpAtCurrent = current ? current.xp_required : 0;
  const xpForNext = next ? next.xp_required : null;
  const xpInLevel = xp - xpAtCurrent;
  const xpToNext = next ? Math.max(0, next.xp_required - xp) : 0;
  const progress = next ? (xpInLevel / (xpForNext - xpAtCurrent)) : 1;

  return {
    level: user.level,
    title: current?.title ?? null,
    xp,
    xpAtCurrent,
    xpForNext,
    xpToNext,
    progress: Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 1)),
    unlocks: current?.unlocks ?? [],
    nextLevel: next
      ? { level: next.level, title: next.title, xp_required: next.xp_required, unlocks: next.unlocks }
      : null,
  };
};
