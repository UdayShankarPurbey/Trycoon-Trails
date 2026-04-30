import { ApiError } from "../utils/ApiError.js";
import { credit } from "./economy.service.js";
import { awardXp } from "./xp.service.js";
import { sequelize } from "../config/db.js";

const STREAK_REWARDS = [
  { coins: 100,  gems: 0,  xp: 10 },  // Day 1
  { coins: 200,  gems: 0,  xp: 20 },  // Day 2
  { coins: 300,  gems: 0,  xp: 30 },  // Day 3
  { coins: 500,  gems: 0,  xp: 50 },  // Day 4
  { coins: 750,  gems: 0,  xp: 75 },  // Day 5
  { coins: 1000, gems: 0,  xp: 100 }, // Day 6
  { coins: 1500, gems: 5,  xp: 150 }, // Day 7+ (cap)
];

const HOURS = (n) => n * 60 * 60 * 1000;

export const claimDailyReward = async (user) => {
  const now = new Date();
  const last = user.last_daily_claim_at ? new Date(user.last_daily_claim_at) : null;

  if (last) {
    const elapsed = now - last;
    if (elapsed < HOURS(20)) {
      const nextClaimAt = new Date(last.getTime() + HOURS(20));
      throw ApiError.tooMany(
        `Daily reward already claimed. Next claim available at ${nextClaimAt.toISOString()}`
      );
    }
  }

  let streak = user.daily_streak || 0;
  if (last && now - last <= HOURS(48)) {
    streak += 1;
  } else {
    streak = 1;
  }

  const idx = Math.min(streak - 1, STREAK_REWARDS.length - 1);
  const reward = STREAK_REWARDS[idx];

  let levelUps = [];
  await sequelize.transaction(async (txn) => {
    user.daily_streak = streak;
    user.last_daily_claim_at = now;
    user.last_active_at = now;
    await user.save({ transaction: txn });

    if (reward.coins > 0) await credit(user, "coins", reward.coins, "daily_reward", { txn });
    if (reward.gems > 0) await credit(user, "gems", reward.gems, "daily_reward", { txn });
    if (reward.xp > 0) {
      const result = await awardXp(user, reward.xp, "daily_reward", { txn });
      levelUps = result.levelUps;
    }
  });

  return { user, streak, reward, levelUps };
};
