import { Op } from "sequelize";
import { Territory, User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const ownerInclude = {
  model: User,
  as: "owner",
  attributes: ["id", "username", "level", "avatar_url", "shield_until", "last_active_at"],
};

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const listWorld = asyncHandler(async (req, res) => {
  const limit = Math.min(toInt(req.query.limit, 100), 500);
  const offset = toInt(req.query.offset, 0);

  const where = {};
  const { x_min, x_max, y_min, y_max, owner_id, has_owner, terrain } = req.query;
  if (x_min !== undefined || x_max !== undefined) {
    where.x = {};
    if (x_min !== undefined) where.x[Op.gte] = toInt(x_min, 0);
    if (x_max !== undefined) where.x[Op.lte] = toInt(x_max, 0);
  }
  if (y_min !== undefined || y_max !== undefined) {
    where.y = {};
    if (y_min !== undefined) where.y[Op.gte] = toInt(y_min, 0);
    if (y_max !== undefined) where.y[Op.lte] = toInt(y_max, 0);
  }
  if (owner_id) where.owner_id = owner_id;
  if (has_owner === "true") where.owner_id = { [Op.ne]: null };
  if (has_owner === "false") where.owner_id = null;
  if (terrain) where.terrain = terrain;

  const { rows, count } = await Territory.findAndCountAll({
    where,
    include: [ownerInclude],
    order: [
      ["y", "ASC"],
      ["x", "ASC"],
    ],
    limit,
    offset,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      { total: count, limit, offset, items: rows },
      "OK"
    )
  );
});

export const getTerritoryById = asyncHandler(async (req, res) => {
  const territory = await Territory.findByPk(req.params.id, { include: [ownerInclude] });
  if (!territory) throw ApiError.notFound("Territory not found");
  res.status(200).json(new ApiResponse(200, territory, "OK"));
});

export const getTerritoryAtCoords = asyncHandler(async (req, res) => {
  const x = toInt(req.params.x, NaN);
  const y = toInt(req.params.y, NaN);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw ApiError.badRequest("x and y must be integers");
  }
  const territory = await Territory.findOne({ where: { x, y }, include: [ownerInclude] });
  if (!territory) throw ApiError.notFound(`No tile at (${x},${y})`);
  res.status(200).json(new ApiResponse(200, territory, "OK"));
});

export const getMyTerritories = asyncHandler(async (req, res) => {
  const territories = await Territory.findAll({
    where: { owner_id: req.user.id },
    order: [
      ["captured_at", "DESC"],
      ["y", "ASC"],
      ["x", "ASC"],
    ],
  });
  res.status(200).json(new ApiResponse(200, { count: territories.length, items: territories }, "OK"));
});
