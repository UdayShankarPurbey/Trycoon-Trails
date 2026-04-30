import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  scoutTerritory,
  attackTerritory,
  listMyBattles,
  getBattleById,
} from "../services/combat.service.js";

export const scout = asyncHandler(async (req, res) => {
  const result = await scoutTerritory(req.user, req.params.id);
  await req.user.reload();
  res.status(200).json(
    new ApiResponse(
      200,
      { ...result, balances: { coins: Number(req.user.coins) } },
      `Scouted territory at (${result.territory.x},${result.territory.y})`
    )
  );
});

export const attack = asyncHandler(async (req, res) => {
  const { units } = req.body || {};
  if (!Array.isArray(units) || units.length === 0) {
    throw ApiError.badRequest("units array is required");
  }
  const result = await attackTerritory(req.user, {
    territoryId: req.params.id,
    units,
  });
  await req.user.reload();

  const headline = result.attackerWon
    ? result.captured
      ? "Victory! Territory captured."
      : "Victory! (Capture requires level 8 — territory is in cooldown.)"
    : "Defeat. The defender held.";

  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...result,
        balances: {
          coins: Number(req.user.coins),
          reputation: Number(req.user.reputation),
          xp: Number(req.user.xp),
          level: req.user.level,
        },
      },
      headline
    )
  );
});

export const myBattles = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = parseInt(req.query.offset, 10) || 0;
  const { rows, count } = await listMyBattles(req.user.id, { limit, offset });
  res.status(200).json(
    new ApiResponse(200, { total: count, limit, offset, items: rows }, "OK")
  );
});

export const battleById = asyncHandler(async (req, res) => {
  const battle = await getBattleById(req.params.id);
  if (!battle) throw ApiError.notFound("Battle not found");
  res.status(200).json(new ApiResponse(200, battle, "OK"));
});
