import { Business, BusinessType, Territory } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  buyBusiness,
  upgradeBusiness,
  listMyBusinesses,
} from "../services/business.service.js";
import {
  computeBusinessIncome,
  collectSingleBusiness,
  collectForUser,
} from "../services/income.service.js";
import { sequelize } from "../config/db.js";

export const listBusinessTypes = asyncHandler(async (_req, res) => {
  const types = await BusinessType.findAll({
    where: { is_active: true },
    order: [["unlock_level", "ASC"]],
  });
  res.status(200).json(new ApiResponse(200, { types }, "OK"));
});

export const myBusinesses = asyncHandler(async (req, res) => {
  const businesses = await listMyBusinesses(req.user.id);
  const now = new Date();
  const items = businesses.map((b) => {
    const { earned, minutes, perMin } = computeBusinessIncome(b, b.territory, req.user, now);
    return {
      id: b.id,
      level: b.level,
      type: { id: b.type.id, code: b.type.code, name: b.type.name, max_level: b.type.max_level },
      territory: { id: b.territory.id, x: b.territory.x, y: b.territory.y, name: b.territory.name },
      last_collected_at: b.last_collected_at,
      income: {
        per_minute: Math.floor(perMin * Number(b.territory.income_multiplier)),
        uncollected: earned,
        minutes_since_collect: Math.floor(minutes),
      },
      upgrade_cost: b.type.costToUpgrade(b.level),
    };
  });
  res.status(200).json(new ApiResponse(200, { count: items.length, items }, "OK"));
});

export const create = asyncHandler(async (req, res) => {
  const { territory_id, type_id, type_code } = req.body || {};
  if (!territory_id) throw ApiError.badRequest("territory_id is required");
  if (!type_id && !type_code) throw ApiError.badRequest("type_id or type_code is required");

  const result = await buyBusiness(req.user, {
    territoryId: territory_id,
    typeId: type_id,
    typeCode: type_code,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        business: result.business,
        type: result.type,
        cost: result.cost,
        balances: { coins: Number(req.user.coins) },
      },
      `Bought ${result.type.name} for ${result.cost} coins`
    )
  );
});

export const upgrade = asyncHandler(async (req, res) => {
  const { business, cost } = await upgradeBusiness(req.user, req.params.id);
  res.status(200).json(
    new ApiResponse(
      200,
      {
        business,
        cost,
        balances: { coins: Number(req.user.coins) },
      },
      `Upgraded to level ${business.level} for ${cost} coins`
    )
  );
});

export const collect = asyncHandler(async (req, res) => {
  const business = await Business.findByPk(req.params.id, {
    include: [{ model: Territory, as: "territory" }],
  });
  if (!business) throw ApiError.notFound("Business not found");
  if (business.territory.owner_id !== req.user.id) {
    throw ApiError.forbidden("You do not own this business");
  }
  const result = await collectSingleBusiness(business);
  await req.user.reload();
  res.status(200).json(
    new ApiResponse(200, { ...result, balances: { coins: Number(req.user.coins) } }, "Collected")
  );
});

export const collectAll = asyncHandler(async (req, res) => {
  const result = await sequelize.transaction(async (txn) => collectForUser(req.user.id, { txn }));
  await req.user.reload();
  res.status(200).json(
    new ApiResponse(
      200,
      { ...result, balances: { coins: Number(req.user.coins) } },
      `Collected ${result.earned} coins from ${result.businesses} businesses`
    )
  );
});
