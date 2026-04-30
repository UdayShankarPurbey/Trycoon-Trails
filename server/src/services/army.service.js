import { Op } from "sequelize";
import { Army, UnitType, Territory } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { sequelize } from "../config/db.js";
import { credit, debit } from "./economy.service.js";
import { redis } from "../config/redis.js";

const MANPOWER_REGEN_KEY = (userId) => `mp:last:${userId}`;
const MANPOWER_PER_HOUR = 10;
const MANPOWER_INTERVAL_MS = (60 * 60 * 1000) / MANPOWER_PER_HOUR;

export const manpowerCap = (level) => 100 + (Number(level) - 1) * 25;

export const initManpowerRegen = async (userId) => {
  await redis.set(MANPOWER_REGEN_KEY(userId), Date.now().toString());
};

export const regenManpower = async (user, { txn = null } = {}) => {
  const cap = manpowerCap(user.level);
  const now = Date.now();
  const lastStr = await redis.get(MANPOWER_REGEN_KEY(user.id));

  if (!lastStr) {
    await redis.set(MANPOWER_REGEN_KEY(user.id), now.toString());
    return { regenerated: 0, cap, current: Number(user.manpower) };
  }

  if (Number(user.manpower) >= cap) {
    await redis.set(MANPOWER_REGEN_KEY(user.id), now.toString());
    return { regenerated: 0, cap, current: Number(user.manpower) };
  }

  const lastMs = parseInt(lastStr, 10);
  const elapsed = now - lastMs;
  const grant = Math.floor(elapsed / MANPOWER_INTERVAL_MS);
  if (grant <= 0) return { regenerated: 0, cap, current: Number(user.manpower) };

  const amount = Math.min(grant, cap - Number(user.manpower));
  if (amount > 0) {
    await credit(user, "manpower", amount, "manpower_regen", { txn });
  }

  const consumedMs = grant * MANPOWER_INTERVAL_MS;
  await redis.set(MANPOWER_REGEN_KEY(user.id), (lastMs + consumedMs).toString());

  return { regenerated: amount, cap, current: Number(user.manpower) };
};

export const recruitUnits = async (user, { territoryId, unitTypeId, unitCode, count }) => {
  const n = parseInt(count, 10);
  if (!Number.isFinite(n) || n <= 0) throw ApiError.badRequest("count must be a positive integer");
  if (n > 1000) throw ApiError.badRequest("Cannot recruit more than 1000 at once");

  return sequelize.transaction(async (txn) => {
    const unitType = unitCode
      ? await UnitType.findOne({ where: { code: unitCode }, transaction: txn })
      : await UnitType.findByPk(unitTypeId, { transaction: txn });
    if (!unitType) throw ApiError.notFound("Unit type not found");
    if (!unitType.is_active) throw ApiError.badRequest("This unit type is not available");
    if (user.level < unitType.unlock_level) {
      throw ApiError.forbidden(`Requires player level ${unitType.unlock_level}`);
    }

    const territory = await Territory.findByPk(territoryId, { transaction: txn });
    if (!territory) throw ApiError.notFound("Territory not found");
    if (territory.owner_id !== user.id) throw ApiError.forbidden("You do not own this territory");

    const totalCoinCost = unitType.coin_cost * n;
    const totalManpowerCost = unitType.manpower_cost * n;

    if (Number(user.manpower) < totalManpowerCost) {
      throw ApiError.badRequest(
        `Insufficient manpower (need ${totalManpowerCost}, have ${user.manpower})`
      );
    }

    await debit(user, "coins", totalCoinCost, `recruit:${unitType.code}:x${n}`, { txn });
    await debit(user, "manpower", totalManpowerCost, `recruit:${unitType.code}:x${n}`, { txn });

    const [army, created] = await Army.findOrCreate({
      where: { territory_id: territory.id, unit_type_id: unitType.id },
      defaults: { owner_id: user.id, count: n },
      transaction: txn,
    });
    if (!created) {
      army.count = Number(army.count) + n;
      await army.save({ transaction: txn });
    }

    return { army, unitType, territory, recruited: n, coinCost: totalCoinCost, manpowerCost: totalManpowerCost };
  });
};

export const disbandUnits = async (user, { armyId, count }) => {
  const n = parseInt(count, 10);
  if (!Number.isFinite(n) || n <= 0) throw ApiError.badRequest("count must be a positive integer");

  return sequelize.transaction(async (txn) => {
    const army = await Army.findByPk(armyId, {
      include: [{ model: UnitType, as: "unit_type" }],
      transaction: txn,
    });
    if (!army) throw ApiError.notFound("Army group not found");
    if (army.owner_id !== user.id) throw ApiError.forbidden("Not your army");
    if (n > Number(army.count)) {
      throw ApiError.badRequest(`Cannot disband ${n} (you have ${army.count})`);
    }

    army.count = Number(army.count) - n;
    if (army.count === 0) {
      await army.destroy({ transaction: txn });
    } else {
      await army.save({ transaction: txn });
    }

    const refund = Math.floor(army.unit_type.manpower_cost * n * 0.5);
    if (refund > 0) {
      await credit(user, "manpower", refund, `disband:${army.unit_type.code}:x${n}`, { txn });
    }

    return { disbanded: n, manpowerRefunded: refund, remaining: Number(army.count) };
  });
};

export const computeUserUpkeepPerMin = async (userId, { txn = null } = {}) => {
  const armies = await Army.findAll({
    where: { owner_id: userId, count: { [Op.gt]: 0 } },
    include: [{ model: UnitType, as: "unit_type" }],
    transaction: txn,
  });
  let total = 0;
  for (const a of armies) {
    total += Number(a.unit_type.upkeep_per_min) * Number(a.count);
  }
  return total;
};

export const listMyArmies = async (userId) => {
  return Army.findAll({
    where: { owner_id: userId },
    include: [
      { model: UnitType, as: "unit_type" },
      { model: Territory, as: "territory" },
    ],
    order: [["created_at", "ASC"]],
  });
};

export const userArmyStrength = async (userId) => {
  const armies = await listMyArmies(userId);
  let attack = 0;
  let defense = 0;
  for (const a of armies) {
    attack += Number(a.unit_type.attack) * Number(a.count);
    defense += Number(a.unit_type.defense) * Number(a.count);
  }
  return { attack, defense, groups: armies.length };
};
