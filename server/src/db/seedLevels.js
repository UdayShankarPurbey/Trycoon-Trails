import { Level } from "../models/index.js";
import { logger } from "../utils/logger.js";

const LEVEL_DATA = [
  { level: 1,  title: "Trader",        xp_required: 0,     reward_coins: 0,      reward_gems: 0,    unlocks: ["starter_business", "view_own_world", "basic_missions"] },
  { level: 2,  title: "Shopkeeper",    xp_required: 100,   reward_coins: 200,    reward_gems: 0,    unlocks: ["second_business_slot", "daily_missions"] },
  { level: 3,  title: "Merchant",      xp_required: 300,   reward_coins: 500,    reward_gems: 5,    unlocks: ["world_map"] },
  { level: 4,  title: "Investor",      xp_required: 700,   reward_coins: 1000,   reward_gems: 10,   unlocks: ["recruit_basic_army"] },
  { level: 5,  title: "Industrialist", xp_required: 1500,  reward_coins: 2500,   reward_gems: 25,   unlocks: ["second_territory", "advanced_businesses"] },
  { level: 6,  title: "Tycoon",        xp_required: 3000,  reward_coins: 5000,   reward_gems: 50,   unlocks: ["offensive_units", "scout_players"] },
  { level: 7,  title: "Magnate",       xp_required: 6000,  reward_coins: 10000,  reward_gems: 100,  unlocks: ["attack_players"] },
  { level: 8,  title: "Baron",         xp_required: 12000, reward_coins: 20000,  reward_gems: 200,  unlocks: ["capture_territory"] },
  { level: 9,  title: "Mogul",         xp_required: 24000, reward_coins: 50000,  reward_gems: 500,  unlocks: ["alliances"] },
  { level: 10, title: "Empire",        xp_required: 50000, reward_coins: 100000, reward_gems: 1000, unlocks: ["prestige_powers", "leaderboard_rewards"] },
];

export const seedLevels = async () => {
  for (const row of LEVEL_DATA) {
    await Level.upsert(row);
  }
  logger.info(`Levels seed: ${LEVEL_DATA.length} levels upserted`);
};

export { LEVEL_DATA };
