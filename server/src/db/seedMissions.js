import { Mission } from "../models/index.js";
import { logger } from "../utils/logger.js";

const SEED = [
  // ===== DAILY (reset every UTC day) =====
  { code: "daily_buy_1",      type: "daily",       title: "Open for Business",        description: "Buy 1 business today.",         goal_type: "buy_business",    goal_value: 1,   reward_coins: 100,    reward_gems: 0,   reward_xp: 5,   required_level: 1, sort_order: 10 },
  { code: "daily_upgrade_1",  type: "daily",       title: "Reinvest",                  description: "Upgrade 1 business today.",     goal_type: "upgrade_business",goal_value: 1,   reward_coins: 200,    reward_gems: 0,   reward_xp: 10,  required_level: 1, sort_order: 20 },
  { code: "daily_recruit_10", type: "daily",       title: "Boots on the Ground",       description: "Recruit 10 units today.",       goal_type: "recruit_units",   goal_value: 10,  reward_coins: 500,    reward_gems: 0,   reward_xp: 25,  required_level: 4, sort_order: 30 },
  { code: "daily_win_1",      type: "daily",       title: "First Strike",              description: "Win 1 battle today.",            goal_type: "win_battle",      goal_value: 1,   reward_coins: 1000,   reward_gems: 5,   reward_xp: 50,  required_level: 7, sort_order: 40 },

  // ===== STORY (one-time, drives progression) =====
  { code: "story_first_business", type: "story",   title: "First Business",             description: "Buy your first business.",       goal_type: "buy_business",    goal_value: 1,   reward_coins: 200,    reward_gems: 0,   reward_xp: 25,  required_level: 1, sort_order: 100 },
  { code: "story_first_upgrade",  type: "story",   title: "Growing the Empire",         description: "Upgrade a business for the first time.", goal_type: "upgrade_business", goal_value: 1, reward_coins: 300, reward_gems: 0, reward_xp: 30, required_level: 1, sort_order: 110 },
  { code: "story_recruit_first",  type: "story",   title: "First Recruit",              description: "Recruit your first unit.",        goal_type: "recruit_units",   goal_value: 1,   reward_coins: 200,    reward_gems: 5,   reward_xp: 50,  required_level: 4, sort_order: 120 },
  { code: "story_first_win",      type: "story",   title: "First Blood",                description: "Win your first battle.",          goal_type: "win_battle",      goal_value: 1,   reward_coins: 500,    reward_gems: 10,  reward_xp: 100, required_level: 7, sort_order: 130 },
  { code: "story_first_capture",  type: "story",   title: "Claim Your Throne",          description: "Capture your first territory.",   goal_type: "capture_territory", goal_value: 1, reward_coins: 2000, reward_gems: 50, reward_xp: 200, required_level: 8, sort_order: 140 },

  // ===== ACHIEVEMENTS (long-term, prestige) =====
  { code: "ach_buy_10",      type: "achievement", title: "Mogul",                     description: "Buy 10 businesses (lifetime).",   goal_type: "buy_business",    goal_value: 10,  reward_coins: 5000,   reward_gems: 50,  reward_xp: 500,  required_level: 1, sort_order: 200 },
  { code: "ach_recruit_100", type: "achievement", title: "Commander",                 description: "Recruit 100 units (lifetime).",   goal_type: "recruit_units",   goal_value: 100, reward_coins: 5000,   reward_gems: 50,  reward_xp: 500,  required_level: 4, sort_order: 210 },
  { code: "ach_capture_5",   type: "achievement", title: "Conqueror",                 description: "Capture 5 territories.",          goal_type: "capture_territory", goal_value: 5, reward_coins: 10000,  reward_gems: 100, reward_xp: 1000, required_level: 8, sort_order: 220 },
  { code: "ach_reach_5",     type: "achievement", title: "Industrialist",             description: "Reach level 5.",                  goal_type: "reach_level",     goal_mode: "max", goal_value: 5, reward_coins: 1000, reward_gems: 25, reward_xp: 100,  required_level: 1, sort_order: 230 },
  { code: "ach_reach_10",    type: "achievement", title: "Empire",                    description: "Reach level 10.",                 goal_type: "reach_level",     goal_mode: "max", goal_value: 10, reward_coins: 50000, reward_gems: 500, reward_xp: 0,    required_level: 1, sort_order: 240 },
];

export const seedMissions = async () => {
  for (const row of SEED) {
    const [m] = await Mission.findOrCreate({
      where: { code: row.code },
      defaults: row,
    });
    if (!m.isNewRecord) {
      Object.assign(m, row);
      await m.save();
    }
  }
  logger.info(`Mission seed: ${SEED.length} missions upserted`);
};
