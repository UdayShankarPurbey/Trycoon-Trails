import { UnitType } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  recruitUnits,
  disbandUnits,
  listMyArmies,
  userArmyStrength,
  manpowerCap,
  regenManpower,
} from "../services/army.service.js";

export const listUnitTypes = asyncHandler(async (_req, res) => {
  const types = await UnitType.findAll({
    where: { is_active: true },
    order: [["unlock_level", "ASC"], ["coin_cost", "ASC"]],
  });
  res.status(200).json(new ApiResponse(200, { types }, "OK"));
});

export const recruit = asyncHandler(async (req, res) => {
  const { territory_id, unit_type_id, unit_code, count } = req.body || {};
  if (!territory_id) throw ApiError.badRequest("territory_id is required");
  if (!unit_type_id && !unit_code) {
    throw ApiError.badRequest("unit_type_id or unit_code is required");
  }
  const result = await recruitUnits(req.user, {
    territoryId: territory_id,
    unitTypeId: unit_type_id,
    unitCode: unit_code,
    count,
  });
  await req.user.reload();
  res.status(201).json(
    new ApiResponse(
      201,
      {
        recruited: result.recruited,
        unitType: result.unitType,
        coinCost: result.coinCost,
        manpowerCost: result.manpowerCost,
        balances: { coins: Number(req.user.coins), manpower: Number(req.user.manpower) },
      },
      `Recruited ${result.recruited} ${result.unitType.name}`
    )
  );
});

export const disband = asyncHandler(async (req, res) => {
  const { count } = req.body || {};
  const result = await disbandUnits(req.user, { armyId: req.params.id, count });
  await req.user.reload();
  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...result,
        balances: { coins: Number(req.user.coins), manpower: Number(req.user.manpower) },
      },
      `Disbanded ${result.disbanded} units`
    )
  );
});

export const myArmy = asyncHandler(async (req, res) => {
  await regenManpower(req.user);
  await req.user.reload();
  const armies = await listMyArmies(req.user.id);
  const strength = await userArmyStrength(req.user.id);
  const items = armies.map((a) => ({
    id: a.id,
    count: Number(a.count),
    territory: { id: a.territory.id, x: a.territory.x, y: a.territory.y, name: a.territory.name },
    unit_type: a.unit_type,
    upkeep_per_min_total: Number(a.unit_type.upkeep_per_min) * Number(a.count),
  }));
  res.status(200).json(
    new ApiResponse(
      200,
      {
        manpower: { current: Number(req.user.manpower), cap: manpowerCap(req.user.level) },
        strength,
        groups: items.length,
        items,
      },
      "OK"
    )
  );
});
