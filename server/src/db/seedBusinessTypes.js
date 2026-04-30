import { BusinessType } from "../models/index.js";
import { logger } from "../utils/logger.js";

const SEED = [
  { code: "farm",     name: "Farm",     description: "Grows crops and livestock for steady income.",            base_cost: 100,    base_income_per_min: 5,    upgrade_cost_multiplier: 1.50, upgrade_income_multiplier: 1.40, unlock_level: 1 },
  { code: "shop",     name: "Shop",     description: "Retail storefront — moderate income, steady customers.",  base_cost: 500,    base_income_per_min: 20,   upgrade_cost_multiplier: 1.50, upgrade_income_multiplier: 1.40, unlock_level: 2 },
  { code: "factory",  name: "Factory",  description: "Mass production for big payouts.",                         base_cost: 2000,   base_income_per_min: 80,   upgrade_cost_multiplier: 1.60, upgrade_income_multiplier: 1.45, unlock_level: 3 },
  { code: "bank",     name: "Bank",     description: "Generates wealth through financial services.",             base_cost: 10000,  base_income_per_min: 400,  upgrade_cost_multiplier: 1.70, upgrade_income_multiplier: 1.50, unlock_level: 5 },
  { code: "tech_lab", name: "Tech Lab", description: "Cutting-edge research yields the highest returns.",        base_cost: 50000,  base_income_per_min: 2000, upgrade_cost_multiplier: 1.80, upgrade_income_multiplier: 1.50, unlock_level: 7 },
];

export const seedBusinessTypes = async () => {
  for (const row of SEED) {
    const [bt] = await BusinessType.findOrCreate({
      where: { code: row.code },
      defaults: row,
    });
    if (!bt.isNewRecord) {
      Object.assign(bt, row);
      await bt.save();
    }
  }
  logger.info(`BusinessType seed: ${SEED.length} types upserted`);
};
