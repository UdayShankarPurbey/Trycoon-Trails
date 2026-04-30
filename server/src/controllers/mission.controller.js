import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  listMissionsForUser,
  claimMissionReward,
} from "../services/mission.service.js";

export const list = asyncHandler(async (req, res) => {
  const items = await listMissionsForUser(req.user, { type: req.query.type });
  res.status(200).json(new ApiResponse(200, { count: items.length, items }, "OK"));
});

export const claim = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = await claimMissionReward(req.user, id);
  await req.user.reload();
  res.status(200).json(
    new ApiResponse(
      200,
      {
        mission: {
          id: result.mission.id,
          code: result.mission.code,
          title: result.mission.title,
        },
        rewards: {
          coins: result.mission.reward_coins,
          gems: result.mission.reward_gems,
          xp: result.mission.reward_xp,
        },
        levelUps: result.levelUps,
        balances: {
          coins: Number(req.user.coins),
          gems: Number(req.user.gems),
          xp: Number(req.user.xp),
          level: req.user.level,
        },
      },
      result.levelUps.length
        ? `Claimed "${result.mission.title}" — leveled up to ${req.user.level}!`
        : `Claimed "${result.mission.title}"`
    )
  );
});
