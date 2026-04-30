import { Territory } from "../models/index.js";
import { logger } from "../utils/logger.js";

export const WORLD_SIZE = 50;

const TERRAIN_PROFILES = {
  plains:   { weight: 50, business_capacity: 4, defense_bonus: 0,  income_multiplier: 1.10 },
  forest:   { weight: 20, business_capacity: 3, defense_bonus: 10, income_multiplier: 1.00 },
  mountain: { weight: 15, business_capacity: 2, defense_bonus: 25, income_multiplier: 0.90 },
  coast:    { weight: 10, business_capacity: 3, defense_bonus: 5,  income_multiplier: 1.20 },
  desert:   { weight: 5,  business_capacity: 3, defense_bonus: 0,  income_multiplier: 0.95 },
};

const buildTerrainPicker = () => {
  const cumulative = [];
  let total = 0;
  for (const [name, p] of Object.entries(TERRAIN_PROFILES)) {
    total += p.weight;
    cumulative.push({ name, threshold: total, profile: p });
  }
  return () => {
    const r = Math.random() * total;
    return cumulative.find((c) => r < c.threshold);
  };
};

const tileName = (x, y) => `Tile (${x},${y})`;

export const seedWorld = async () => {
  const existing = await Territory.count();
  const expected = WORLD_SIZE * WORLD_SIZE;

  if (existing >= expected) {
    logger.debug(`World seed: ${existing}/${expected} tiles already exist, skipping`);
    return;
  }

  const pickTerrain = buildTerrainPicker();
  const rows = [];

  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      const { name: terrain, profile } = pickTerrain();
      rows.push({
        x,
        y,
        name: tileName(x, y),
        terrain,
        business_capacity: profile.business_capacity,
        defense_bonus: profile.defense_bonus,
        income_multiplier: profile.income_multiplier,
      });
    }
  }

  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    await Territory.bulkCreate(rows.slice(i, i + BATCH), { ignoreDuplicates: true });
  }

  logger.info(`World seed: created ${rows.length} tiles (${WORLD_SIZE}x${WORLD_SIZE})`);
};
