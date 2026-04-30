import { Op } from "sequelize";
import {
  Army,
  UnitType,
  Territory,
  User,
  Business,
  Battle,
} from "../models/index.js";
import { sequelize } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { credit, debit } from "./economy.service.js";
import { awardXp } from "./xp.service.js";
import { spawnStarterTerritory } from "./world.service.js";
import { recordEvent } from "./mission.service.js";
import { incrementScore } from "./leaderboard.service.js";
import { createNotification } from "./notification.service.js";
import { logger } from "../utils/logger.js";

const SCOUT_LEVEL = 6;
const ATTACK_LEVEL = 7;
const CAPTURE_LEVEL = 8;
const SCOUT_FEE_COINS = 50;
const CAPTURE_COOLDOWN_HOURS = 24;
const ATTACKER_LOSS_ON_WIN_PCT = 0.25;
const ATTACKER_LOSS_ON_LOSS_PCT = 0.75;
const DEFENDER_LOSS_ON_LOSS_PCT = 0.10;

const reputationBonus = (reputation) => Math.max(0, Math.floor(Number(reputation) / 10));

const summarizeUnits = (rows) =>
  rows.map((r) => ({
    army_id: r.army_id || r.id,
    unit_type_id: r.unit_type_id ?? r.unit_type?.id,
    code: r.code || r.unit_type?.code,
    name: r.name || r.unit_type?.name,
    count: Number(r.count),
    attack: r.attack ?? r.unit_type?.attack,
    defense: r.defense ?? r.unit_type?.defense,
  }));

const ensureNotShielded = (defender) => {
  if (defender?.shield_until && new Date(defender.shield_until) > new Date()) {
    throw ApiError.forbidden(
      `Defender is under new-player shield until ${defender.shield_until}`
    );
  }
};

const ensureNotInCooldown = (territory) => {
  if (territory.capture_cooldown_until && new Date(territory.capture_cooldown_until) > new Date()) {
    throw ApiError.forbidden(
      `Territory is in capture cooldown until ${territory.capture_cooldown_until}`
    );
  }
};

const loadTargetTerritory = async (territoryId, { txn = null, lock = false } = {}) => {
  const opts = { transaction: txn };
  if (lock && txn) opts.lock = txn.LOCK.UPDATE;
  const territory = await Territory.findByPk(territoryId, opts);
  if (!territory) throw ApiError.notFound("Territory not found");
  return territory;
};

export const scoutTerritory = async (user, territoryId) => {
  if (user.level < SCOUT_LEVEL) {
    throw ApiError.forbidden(`Scouting requires player level ${SCOUT_LEVEL}`);
  }

  return sequelize.transaction(async (txn) => {
    const territory = await loadTargetTerritory(territoryId, { txn });
    if (territory.owner_id === user.id) {
      throw ApiError.badRequest("You already own this territory");
    }

    await debit(user, "coins", SCOUT_FEE_COINS, `scout:${territory.id}`, { txn });

    const armies = await Army.findAll({
      where: { territory_id: territory.id, count: { [Op.gt]: 0 } },
      include: [{ model: UnitType, as: "unit_type" }],
      transaction: txn,
    });

    const owner = territory.owner_id
      ? await User.findByPk(territory.owner_id, {
          attributes: ["id", "username", "level", "reputation", "shield_until"],
          transaction: txn,
        })
      : null;

    return {
      territory: {
        id: territory.id,
        x: territory.x,
        y: territory.y,
        name: territory.name,
        terrain: territory.terrain,
        defense_bonus: Number(territory.defense_bonus),
        capture_cooldown_until: territory.capture_cooldown_until,
      },
      owner,
      defender_strength: armies.reduce(
        (s, a) => s + Number(a.unit_type.defense) * Number(a.count),
        0
      ),
      armies: armies.map((a) => ({
        unit_type: {
          id: a.unit_type.id,
          code: a.unit_type.code,
          name: a.unit_type.name,
          attack: a.unit_type.attack,
          defense: a.unit_type.defense,
        },
        count: Number(a.count),
      })),
    };
  });
};

const validateAndLockAttackingForce = async (user, units, txn) => {
  if (!Array.isArray(units) || units.length === 0) {
    throw ApiError.badRequest("units array is required");
  }

  const force = [];
  for (const u of units) {
    const armyId = u.army_id;
    const send = parseInt(u.count, 10);
    if (!armyId) throw ApiError.badRequest("Each unit entry needs army_id");
    if (!Number.isFinite(send) || send <= 0) {
      throw ApiError.badRequest("Each unit entry needs count > 0");
    }
    const army = await Army.findByPk(armyId, {
      include: [{ model: UnitType, as: "unit_type" }],
      transaction: txn,
      lock: txn.LOCK.UPDATE,
    });
    if (!army) throw ApiError.notFound(`Army group ${armyId} not found`);
    if (army.owner_id !== user.id) throw ApiError.forbidden("Not your army");
    if (Number(army.count) < send) {
      throw ApiError.badRequest(
        `Army ${army.unit_type.code} has only ${army.count} units (you tried to send ${send})`
      );
    }
    force.push({
      army,
      send,
      unit_type: army.unit_type,
    });
  }
  return force;
};

export const attackTerritory = async (user, { territoryId, units }) => {
  if (user.level < ATTACK_LEVEL) {
    throw ApiError.forbidden(`Attacking requires player level ${ATTACK_LEVEL}`);
  }

  return sequelize.transaction(async (txn) => {
    const territory = await loadTargetTerritory(territoryId, { txn, lock: true });
    if (territory.owner_id === user.id) {
      throw ApiError.badRequest("You cannot attack your own territory");
    }
    ensureNotInCooldown(territory);

    const defender = territory.owner_id
      ? await User.findByPk(territory.owner_id, { transaction: txn })
      : null;
    if (defender) ensureNotShielded(defender);

    const force = await validateAndLockAttackingForce(user, units, txn);

    const attackerUnitsSnap = force.map((f) => ({
      army_id: f.army.id,
      unit_type_id: f.unit_type.id,
      code: f.unit_type.code,
      name: f.unit_type.name,
      count: f.send,
      attack: f.unit_type.attack,
      defense: f.unit_type.defense,
    }));
    const attackerStrength = attackerUnitsSnap.reduce(
      (s, u) => s + u.attack * u.count,
      0
    );

    const defenderArmies = await Army.findAll({
      where: { territory_id: territory.id, count: { [Op.gt]: 0 } },
      include: [{ model: UnitType, as: "unit_type" }],
      transaction: txn,
      lock: txn.LOCK.UPDATE,
    });
    const defenderUnitsSnap = defenderArmies.map((a) => ({
      army_id: a.id,
      unit_type_id: a.unit_type.id,
      code: a.unit_type.code,
      name: a.unit_type.name,
      count: Number(a.count),
      attack: a.unit_type.attack,
      defense: a.unit_type.defense,
    }));

    const defenderArmyStrength = defenderUnitsSnap.reduce(
      (s, u) => s + u.defense * u.count,
      0
    );
    const territoryBonus = Number(territory.defense_bonus);
    const repBonus = defender ? reputationBonus(defender.reputation) : 0;
    const defenderStrength = defenderArmyStrength + territoryBonus + repBonus;

    const attackerWon = attackerStrength > defenderStrength;

    const attackerLosses = [];
    const defenderLosses = [];

    if (attackerWon) {
      for (const f of force) {
        const lost = Math.min(f.send, Math.ceil(f.send * ATTACKER_LOSS_ON_WIN_PCT));
        if (lost > 0) {
          attackerLosses.push({
            army_id: f.army.id,
            code: f.unit_type.code,
            count: lost,
          });
          f.army.count = Number(f.army.count) - lost;
          if (f.army.count <= 0) {
            await f.army.destroy({ transaction: txn });
          } else {
            await f.army.save({ transaction: txn });
          }
        }
      }
      for (const a of defenderArmies) {
        defenderLosses.push({
          army_id: a.id,
          code: a.unit_type.code,
          count: Number(a.count),
        });
        await a.destroy({ transaction: txn });
      }
    } else {
      for (const f of force) {
        const lost = Math.min(f.send, Math.ceil(f.send * ATTACKER_LOSS_ON_LOSS_PCT));
        if (lost > 0) {
          attackerLosses.push({
            army_id: f.army.id,
            code: f.unit_type.code,
            count: lost,
          });
          f.army.count = Number(f.army.count) - lost;
          if (f.army.count <= 0) {
            await f.army.destroy({ transaction: txn });
          } else {
            await f.army.save({ transaction: txn });
          }
        }
      }
      for (const a of defenderArmies) {
        const lost = Math.min(Number(a.count), Math.ceil(Number(a.count) * DEFENDER_LOSS_ON_LOSS_PCT));
        if (lost > 0) {
          defenderLosses.push({
            army_id: a.id,
            code: a.unit_type.code,
            count: lost,
          });
          a.count = Number(a.count) - lost;
          if (a.count <= 0) {
            await a.destroy({ transaction: txn });
          } else {
            await a.save({ transaction: txn });
          }
        }
      }
    }

    let captured = false;
    if (attackerWon && user.level >= CAPTURE_LEVEL) {
      territory.owner_id = user.id;
      territory.captured_at = new Date();
      territory.capture_cooldown_until = new Date(
        Date.now() + CAPTURE_COOLDOWN_HOURS * 60 * 60 * 1000
      );

      await Business.update(
        { level: sequelize.literal("GREATEST(FLOOR(`level` / 2), 1)") },
        { where: { territory_id: territory.id }, transaction: txn }
      );

      await territory.save({ transaction: txn });
      captured = true;

      if (defender) {
        const remaining = await Territory.count({
          where: { owner_id: defender.id },
          transaction: txn,
        });
        if (remaining === 0) {
          const newTile = await spawnStarterTerritory(defender, { txn });
          logger.info(
            `Last-territory rule: ${defender.username} granted new starter at (${newTile.x},${newTile.y})`
          );
        }
      }
    } else if (attackerWon) {
      territory.capture_cooldown_until = new Date(
        Date.now() + CAPTURE_COOLDOWN_HOURS * 60 * 60 * 1000
      );
      await territory.save({ transaction: txn });
    }

    const repChange = { attacker: 0, defender: 0 };
    if (attackerWon) {
      repChange.attacker = captured ? 15 : 10;
      repChange.defender = -10;
      await credit(user, "reputation", repChange.attacker, "battle_win", { txn });
      if (defender) {
        await debit(defender, "reputation", Math.abs(repChange.defender), "battle_loss", { txn, allowNegative: true });
      }
      await awardXp(user, captured ? 100 : 50, "battle_attack_win", { txn });
      await recordEvent(user, "win_battle", 1, { txn });
      if (captured) await recordEvent(user, "capture_territory", 1, { txn });
      incrementScore(user.id, "battles_won", 1).catch(() => {});

      if (defender) {
        await createNotification(
          {
            userId: defender.id,
            type: captured ? "territory_captured" : "battle_attacked",
            title: captured
              ? `Your territory at (${territory.x},${territory.y}) was captured!`
              : `${user.username} raided your territory at (${territory.x},${territory.y})`,
            body: captured
              ? `${user.username} (L${user.level}) defeated your defenders and captured the territory.`
              : `${user.username} (L${user.level}) defeated your defenders. The territory is in cooldown for 24h.`,
            data: {
              territory_id: territory.id,
              attacker_id: user.id,
              attacker_username: user.username,
              attacker_strength: attackerStrength,
              defender_strength: defenderStrength,
              captured,
            },
          },
          { txn }
        );
      }
    } else {
      repChange.attacker = -5;
      repChange.defender = 5;
      await debit(user, "reputation", Math.abs(repChange.attacker), "battle_loss", { txn, allowNegative: true });
      if (defender) {
        await credit(defender, "reputation", repChange.defender, "battle_defense_win", { txn });
        await awardXp(defender, 25, "battle_defense_win", { txn });
        incrementScore(defender.id, "battles_won", 1).catch(() => {});
        await createNotification(
          {
            userId: defender.id,
            type: "battle_defended",
            title: `You repelled an attack at (${territory.x},${territory.y})!`,
            body: `${user.username} (L${user.level}) attacked but you held your ground. +25 XP.`,
            data: {
              territory_id: territory.id,
              attacker_id: user.id,
              attacker_username: user.username,
              attacker_strength: attackerStrength,
              defender_strength: defenderStrength,
            },
          },
          { txn }
        );
      }
    }

    const battle = await Battle.create(
      {
        attacker_id: user.id,
        defender_id: defender?.id || null,
        territory_id: territory.id,
        attacker_strength: attackerStrength,
        defender_strength: defenderStrength,
        winner_id: attackerWon ? user.id : defender?.id || null,
        territory_captured: captured,
        attacker_units: attackerUnitsSnap,
        defender_units: defenderUnitsSnap,
        attacker_losses: attackerLosses,
        defender_losses: defenderLosses,
        reputation_change: repChange,
        notes: attackerWon
          ? captured
            ? "Attacker wins and captures territory."
            : `Attacker wins; capture requires level ${CAPTURE_LEVEL}.`
          : "Defender holds.",
      },
      { transaction: txn }
    );

    return {
      battle,
      attackerWon,
      captured,
      attacker: {
        strength: attackerStrength,
        losses: attackerLosses,
        units: attackerUnitsSnap,
      },
      defender: {
        strength: defenderStrength,
        territoryBonus,
        reputationBonus: repBonus,
        losses: defenderLosses,
        units: defenderUnitsSnap,
      },
      reputationChange: repChange,
    };
  });
};

export const listMyBattles = async (userId, { limit = 50, offset = 0 } = {}) => {
  return Battle.findAndCountAll({
    where: {
      [Op.or]: [{ attacker_id: userId }, { defender_id: userId }],
    },
    include: [
      { model: User, as: "attacker", attributes: ["id", "username", "level"] },
      { model: User, as: "defender", attributes: ["id", "username", "level"] },
      { model: Territory, as: "territory", attributes: ["id", "x", "y", "name"] },
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });
};

export const getBattleById = async (id) => {
  return Battle.findByPk(id, {
    include: [
      { model: User, as: "attacker", attributes: ["id", "username", "level"] },
      { model: User, as: "defender", attributes: ["id", "username", "level"] },
      { model: Territory, as: "territory" },
    ],
  });
};
