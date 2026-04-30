import { Op } from "sequelize";
import { Mission, UserMission } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { credit } from "./economy.service.js";
import { sequelize } from "../config/db.js";

const todayPeriod = (date = new Date()) => date.toISOString().slice(0, 10);

const periodFor = (mission, now = new Date()) =>
  mission.type === "daily" ? todayPeriod(now) : "";

const findOrCreateUserMission = async (user, mission, { txn = null } = {}) => {
  const period = periodFor(mission);
  const [um] = await UserMission.findOrCreate({
    where: { user_id: user.id, mission_id: mission.id, daily_period: period },
    defaults: { progress: 0, completed: false, claimed: false },
    transaction: txn,
  });
  return um;
};

export const recordEvent = async (user, goalType, value = 1, { mode = "add", txn = null } = {}) => {
  if (!user) return [];

  const missions = await Mission.findAll({
    where: {
      goal_type: goalType,
      is_active: true,
      required_level: { [Op.lte]: user.level },
    },
    transaction: txn,
  });

  const completed = [];

  for (const mission of missions) {
    const um = await findOrCreateUserMission(user, mission, { txn });
    if (um.completed) continue;

    let nextProgress;
    const effectiveMode = mode || mission.goal_mode || "add";

    if (effectiveMode === "max") {
      nextProgress = Math.max(Number(um.progress), value);
    } else {
      nextProgress = Number(um.progress) + value;
    }

    um.progress = Math.min(nextProgress, mission.goal_value);
    if (Number(um.progress) >= mission.goal_value) {
      um.completed = true;
      um.completed_at = new Date();
      completed.push({ mission, userMission: um });
    }
    await um.save({ transaction: txn });
  }

  return completed;
};

export const listMissionsForUser = async (user, { type } = {}) => {
  const missionWhere = {
    is_active: true,
    required_level: { [Op.lte]: user.level },
  };
  if (type) missionWhere.type = type;

  const missions = await Mission.findAll({
    where: missionWhere,
    order: [
      ["type", "ASC"],
      ["sort_order", "ASC"],
    ],
  });

  const items = [];
  for (const mission of missions) {
    const period = periodFor(mission);
    const um = await UserMission.findOne({
      where: { user_id: user.id, mission_id: mission.id, daily_period: period },
    });
    items.push({
      id: mission.id,
      code: mission.code,
      type: mission.type,
      title: mission.title,
      description: mission.description,
      goal_type: mission.goal_type,
      goal_value: mission.goal_value,
      rewards: {
        coins: mission.reward_coins,
        gems: mission.reward_gems,
        xp: mission.reward_xp,
      },
      progress: um ? Number(um.progress) : 0,
      completed: um ? um.completed : false,
      claimed: um ? um.claimed : false,
      daily_period: period || null,
      claimed_at: um ? um.claimed_at : null,
    });
  }
  return items;
};

export const claimMissionReward = async (user, missionId) => {
  return sequelize.transaction(async (txn) => {
    const mission = await Mission.findByPk(missionId, { transaction: txn });
    if (!mission) throw ApiError.notFound("Mission not found");
    if (!mission.is_active) throw ApiError.badRequest("Mission no longer active");

    const period = periodFor(mission);
    const um = await UserMission.findOne({
      where: { user_id: user.id, mission_id: mission.id, daily_period: period },
      transaction: txn,
    });
    if (!um) throw ApiError.badRequest("Mission not started yet");
    if (!um.completed) throw ApiError.badRequest("Mission not completed");
    if (um.claimed) throw ApiError.badRequest("Reward already claimed");

    if (mission.reward_coins > 0) {
      await credit(user, "coins", mission.reward_coins, `mission:${mission.code}`, { txn });
    }
    if (mission.reward_gems > 0) {
      await credit(user, "gems", mission.reward_gems, `mission:${mission.code}`, { txn });
    }
    let levelUps = [];
    if (mission.reward_xp > 0) {
      const { awardXp } = await import("./xp.service.js");
      const r = await awardXp(user, mission.reward_xp, `mission:${mission.code}`, { txn });
      levelUps = r.levelUps;
    }

    um.claimed = true;
    um.claimed_at = new Date();
    await um.save({ transaction: txn });

    return { mission, userMission: um, levelUps };
  });
};
