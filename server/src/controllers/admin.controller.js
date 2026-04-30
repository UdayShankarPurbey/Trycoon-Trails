import { Op } from "sequelize";
import {
  User, Level, BusinessType, UnitType, Mission, Territory, AuditLog,
} from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { recordAudit } from "../services/audit.service.js";
import {
  banPlayer, unbanPlayer, grantResource, setPlayerRole,
} from "../services/admin.service.js";

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const audit = (req, action, targetTable, targetId, payload) =>
  recordAudit({
    adminId: req.user.id,
    action,
    targetTable,
    targetId,
    payload,
    ip: req.ip,
  });

const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

// ============ LEVELS ============

export const listLevels = asyncHandler(async (_req, res) => {
  const levels = await Level.findAll({ order: [["level", "ASC"]] });
  res.status(200).json(new ApiResponse(200, { levels }, "OK"));
});

export const updateLevel = asyncHandler(async (req, res) => {
  const level = await Level.findByPk(req.params.level);
  if (!level) throw ApiError.notFound("Level not found");
  const updates = pick(req.body || {}, ["title", "xp_required", "reward_coins", "reward_gems", "unlocks"]);
  Object.assign(level, updates);
  await level.save();
  await audit(req, "update_level", "levels", level.level, updates);
  res.status(200).json(new ApiResponse(200, level, "Level updated"));
});

// ============ BUSINESS TYPES ============

export const listBusinessTypes = asyncHandler(async (_req, res) => {
  const types = await BusinessType.findAll({ order: [["unlock_level", "ASC"]] });
  res.status(200).json(new ApiResponse(200, { types }, "OK"));
});

export const createBusinessType = asyncHandler(async (req, res) => {
  const allowed = pick(req.body || {}, [
    "code", "name", "description", "image_url", "base_cost",
    "base_income_per_min", "upgrade_cost_multiplier", "upgrade_income_multiplier",
    "unlock_level", "max_level", "is_active",
  ]);
  if (!allowed.code || !allowed.name || allowed.base_cost === undefined || allowed.base_income_per_min === undefined) {
    throw ApiError.unprocessable("code, name, base_cost, base_income_per_min are required");
  }
  const type = await BusinessType.create(allowed);
  await audit(req, "create_business_type", "business_types", type.id, allowed);
  res.status(201).json(new ApiResponse(201, type, "Business type created"));
});

export const updateBusinessType = asyncHandler(async (req, res) => {
  const type = await BusinessType.findByPk(req.params.id);
  if (!type) throw ApiError.notFound("Business type not found");
  const updates = pick(req.body || {}, [
    "name", "description", "image_url", "base_cost", "base_income_per_min",
    "upgrade_cost_multiplier", "upgrade_income_multiplier", "unlock_level",
    "max_level", "is_active",
  ]);
  Object.assign(type, updates);
  await type.save();
  await audit(req, "update_business_type", "business_types", type.id, updates);
  res.status(200).json(new ApiResponse(200, type, "Business type updated"));
});

export const deleteBusinessType = asyncHandler(async (req, res) => {
  const type = await BusinessType.findByPk(req.params.id);
  if (!type) throw ApiError.notFound("Business type not found");
  type.is_active = false;
  await type.save();
  await audit(req, "deactivate_business_type", "business_types", type.id);
  res.status(200).json(new ApiResponse(200, type, "Business type deactivated"));
});

// ============ UNIT TYPES ============

export const listUnitTypes = asyncHandler(async (_req, res) => {
  const types = await UnitType.findAll({ order: [["unlock_level", "ASC"]] });
  res.status(200).json(new ApiResponse(200, { types }, "OK"));
});

export const createUnitType = asyncHandler(async (req, res) => {
  const allowed = pick(req.body || {}, [
    "code", "name", "description", "image_url", "category",
    "coin_cost", "manpower_cost", "attack", "defense",
    "upkeep_per_min", "unlock_level", "is_active",
  ]);
  if (!allowed.code || !allowed.name || allowed.coin_cost === undefined) {
    throw ApiError.unprocessable("code, name, coin_cost are required");
  }
  const type = await UnitType.create(allowed);
  await audit(req, "create_unit_type", "unit_types", type.id, allowed);
  res.status(201).json(new ApiResponse(201, type, "Unit type created"));
});

export const updateUnitType = asyncHandler(async (req, res) => {
  const type = await UnitType.findByPk(req.params.id);
  if (!type) throw ApiError.notFound("Unit type not found");
  const updates = pick(req.body || {}, [
    "name", "description", "image_url", "category", "coin_cost",
    "manpower_cost", "attack", "defense", "upkeep_per_min",
    "unlock_level", "is_active",
  ]);
  Object.assign(type, updates);
  await type.save();
  await audit(req, "update_unit_type", "unit_types", type.id, updates);
  res.status(200).json(new ApiResponse(200, type, "Unit type updated"));
});

export const deleteUnitType = asyncHandler(async (req, res) => {
  const type = await UnitType.findByPk(req.params.id);
  if (!type) throw ApiError.notFound("Unit type not found");
  type.is_active = false;
  await type.save();
  await audit(req, "deactivate_unit_type", "unit_types", type.id);
  res.status(200).json(new ApiResponse(200, type, "Unit type deactivated"));
});

// ============ MISSIONS ============

export const listMissions = asyncHandler(async (_req, res) => {
  const missions = await Mission.findAll({ order: [["type", "ASC"], ["sort_order", "ASC"]] });
  res.status(200).json(new ApiResponse(200, { missions }, "OK"));
});

export const createMission = asyncHandler(async (req, res) => {
  const allowed = pick(req.body || {}, [
    "code", "type", "title", "description", "goal_type", "goal_mode",
    "goal_value", "reward_coins", "reward_gems", "reward_xp",
    "required_level", "sort_order", "is_active",
  ]);
  if (!allowed.code || !allowed.type || !allowed.title || !allowed.goal_type || allowed.goal_value === undefined) {
    throw ApiError.unprocessable("code, type, title, goal_type, goal_value are required");
  }
  const mission = await Mission.create(allowed);
  await audit(req, "create_mission", "missions", mission.id, allowed);
  res.status(201).json(new ApiResponse(201, mission, "Mission created"));
});

export const updateMission = asyncHandler(async (req, res) => {
  const mission = await Mission.findByPk(req.params.id);
  if (!mission) throw ApiError.notFound("Mission not found");
  const updates = pick(req.body || {}, [
    "title", "description", "goal_type", "goal_mode", "goal_value",
    "reward_coins", "reward_gems", "reward_xp", "required_level",
    "sort_order", "is_active",
  ]);
  Object.assign(mission, updates);
  await mission.save();
  await audit(req, "update_mission", "missions", mission.id, updates);
  res.status(200).json(new ApiResponse(200, mission, "Mission updated"));
});

export const deleteMission = asyncHandler(async (req, res) => {
  const mission = await Mission.findByPk(req.params.id);
  if (!mission) throw ApiError.notFound("Mission not found");
  mission.is_active = false;
  await mission.save();
  await audit(req, "deactivate_mission", "missions", mission.id);
  res.status(200).json(new ApiResponse(200, mission, "Mission deactivated"));
});

// ============ TERRITORIES ============

export const listTerritories = asyncHandler(async (req, res) => {
  const limit = Math.min(toInt(req.query.limit, 100), 500);
  const offset = toInt(req.query.offset, 0);
  const where = {};
  if (req.query.has_owner === "true") where.owner_id = { [Op.ne]: null };
  if (req.query.has_owner === "false") where.owner_id = null;

  const { rows, count } = await Territory.findAndCountAll({
    where,
    include: [{ model: User, as: "owner", attributes: ["id", "username", "level"] }],
    order: [["y", "ASC"], ["x", "ASC"]],
    limit,
    offset,
  });
  res.status(200).json(new ApiResponse(200, { total: count, limit, offset, items: rows }, "OK"));
});

export const updateTerritory = asyncHandler(async (req, res) => {
  const territory = await Territory.findByPk(req.params.id);
  if (!territory) throw ApiError.notFound("Territory not found");
  const updates = pick(req.body || {}, [
    "name", "terrain", "business_capacity", "defense_bonus",
    "income_multiplier", "capture_cooldown_until",
  ]);
  Object.assign(territory, updates);
  await territory.save();
  await audit(req, "update_territory", "territories", territory.id, updates);
  res.status(200).json(new ApiResponse(200, territory, "Territory updated"));
});

export const clearTerritoryOwnership = asyncHandler(async (req, res) => {
  const territory = await Territory.findByPk(req.params.id);
  if (!territory) throw ApiError.notFound("Territory not found");
  const previousOwner = territory.owner_id;
  territory.owner_id = null;
  territory.captured_at = null;
  territory.capture_cooldown_until = null;
  await territory.save();
  await audit(req, "clear_territory", "territories", territory.id, { previous_owner: previousOwner });
  res.status(200).json(new ApiResponse(200, territory, "Territory ownership cleared"));
});

// ============ PLAYERS ============

const safePlayerJSON = (u) => ({
  id: u.id, username: u.username, email: u.email, role: u.role,
  level: u.level, xp: Number(u.xp), coins: Number(u.coins),
  gems: Number(u.gems), manpower: Number(u.manpower),
  reputation: Number(u.reputation), avatar_url: u.avatar_url,
  shield_until: u.shield_until, last_active_at: u.last_active_at,
  is_banned: u.is_banned, banned_reason: u.banned_reason,
  created_at: u.created_at,
});

export const listPlayers = asyncHandler(async (req, res) => {
  const limit = Math.min(toInt(req.query.limit, 50), 200);
  const offset = toInt(req.query.offset, 0);
  const where = {};
  if (req.query.role) where.role = req.query.role;
  if (req.query.is_banned !== undefined) where.is_banned = req.query.is_banned === "true";
  if (req.query.q) {
    where[Op.or] = [
      { username: { [Op.like]: `%${req.query.q}%` } },
      { email: { [Op.like]: `%${req.query.q}%` } },
    ];
  }
  const { rows, count } = await User.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });
  res.status(200).json(
    new ApiResponse(
      200,
      { total: count, limit, offset, items: rows.map(safePlayerJSON) },
      "OK"
    )
  );
});

export const getPlayer = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [{ model: Territory, as: "territories", attributes: ["id", "x", "y", "name", "terrain"] }],
  });
  if (!user) throw ApiError.notFound("User not found");
  const json = safePlayerJSON(user);
  json.territories = user.territories;
  res.status(200).json(new ApiResponse(200, json, "OK"));
});

export const banUser = asyncHandler(async (req, res) => {
  const { reason } = req.body || {};
  const user = await banPlayer(req.user, req.params.id, reason);
  await audit(req, "ban_player", "users", user.id, { reason: user.banned_reason });
  res.status(200).json(new ApiResponse(200, safePlayerJSON(user), "Player banned"));
});

export const unbanUser = asyncHandler(async (req, res) => {
  const user = await unbanPlayer(req.params.id);
  await audit(req, "unban_player", "users", user.id);
  res.status(200).json(new ApiResponse(200, safePlayerJSON(user), "Player unbanned"));
});

export const grantToPlayer = asyncHandler(async (req, res) => {
  const { kind, amount, reason } = req.body || {};
  const user = await grantResource(req.user, req.params.id, { kind, amount, reason });
  await audit(req, "grant_resource", "users", user.id, { kind, amount, reason });
  res.status(200).json(new ApiResponse(200, safePlayerJSON(user), `Granted ${amount} ${kind}`));
});

export const updatePlayerRole = asyncHandler(async (req, res) => {
  const { role } = req.body || {};
  const user = await setPlayerRole(req.user, req.params.id, role);
  await audit(req, "set_role", "users", user.id, { role });
  res.status(200).json(new ApiResponse(200, safePlayerJSON(user), `Role set to ${role}`));
});

// ============ AUDIT LOG ============

export const listAuditLog = asyncHandler(async (req, res) => {
  const limit = Math.min(toInt(req.query.limit, 50), 200);
  const offset = toInt(req.query.offset, 0);
  const where = {};
  if (req.query.admin_id) where.admin_id = req.query.admin_id;
  if (req.query.action) where.action = req.query.action;
  if (req.query.target_table) where.target_table = req.query.target_table;

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, as: "admin", attributes: ["id", "username"] }],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });
  res.status(200).json(new ApiResponse(200, { total: count, limit, offset, items: rows }, "OK"));
});
