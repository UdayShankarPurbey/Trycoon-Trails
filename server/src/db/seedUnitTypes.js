import { UnitType } from "../models/index.js";
import { logger } from "../utils/logger.js";

const SEED = [
  { code: "guard",    name: "Guard",    category: "defense", description: "Stalwart defenders. Cheap and durable.",      coin_cost: 200,   manpower_cost: 1, attack: 5,  defense: 15, upkeep_per_min: 1, unlock_level: 4 },
  { code: "scout",    name: "Scout",    category: "scout",   description: "Reveal enemy armies before attacking.",       coin_cost: 300,   manpower_cost: 1, attack: 5,  defense: 5,  upkeep_per_min: 1, unlock_level: 4 },
  { code: "soldier",  name: "Soldier",  category: "offense", description: "Frontline attackers — solid offense.",        coin_cost: 500,   manpower_cost: 1, attack: 20, defense: 10, upkeep_per_min: 2, unlock_level: 6 },
  { code: "cavalry",  name: "Cavalry",  category: "offense", description: "Heavy cavalry — high attack and defense.",    coin_cost: 2000,  manpower_cost: 2, attack: 50, defense: 25, upkeep_per_min: 5, unlock_level: 7 },
];

export const seedUnitTypes = async () => {
  for (const row of SEED) {
    const [unit] = await UnitType.findOrCreate({
      where: { code: row.code },
      defaults: row,
    });
    if (!unit.isNewRecord) {
      Object.assign(unit, row);
      await unit.save();
    }
  }
  logger.info(`UnitType seed: ${SEED.length} types upserted`);
};
