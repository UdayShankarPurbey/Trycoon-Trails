import { Op } from "sequelize";
import { Territory } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { sequelize } from "../config/db.js";

export const spawnStarterTerritory = async (user, { txn = null } = {}) => {
  const territory = await Territory.findOne({
    where: { owner_id: null, terrain: { [Op.in]: ["plains", "forest"] } },
    order: sequelize.random(),
    transaction: txn,
    lock: txn ? txn.LOCK.UPDATE : undefined,
  });

  if (!territory) {
    const fallback = await Territory.findOne({
      where: { owner_id: null },
      order: sequelize.random(),
      transaction: txn,
      lock: txn ? txn.LOCK.UPDATE : undefined,
    });
    if (!fallback) throw ApiError.internal("World is full — no unclaimed tiles");
    fallback.owner_id = user.id;
    fallback.captured_at = new Date();
    fallback.name = `${user.username}'s Land`;
    await fallback.save({ transaction: txn });
    return fallback;
  }

  territory.owner_id = user.id;
  territory.captured_at = new Date();
  territory.name = `${user.username}'s Land`;
  await territory.save({ transaction: txn });
  return territory;
};

export const assertNotShielded = (defender) => {
  if (defender.shield_until && new Date(defender.shield_until) > new Date()) {
    throw ApiError.forbidden(`Player is under new-player shield until ${defender.shield_until}`);
  }
};

export const assertNotInCooldown = (territory) => {
  if (territory.isInCooldown()) {
    throw ApiError.forbidden(
      `Territory in capture cooldown until ${territory.capture_cooldown_until}`
    );
  }
};

export const transferTerritory = async (territory, newOwnerId, { txn = null, cooldownHours = 24 } = {}) => {
  territory.owner_id = newOwnerId;
  territory.captured_at = new Date();
  territory.capture_cooldown_until = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);
  await territory.save({ transaction: txn });
  return territory;
};
