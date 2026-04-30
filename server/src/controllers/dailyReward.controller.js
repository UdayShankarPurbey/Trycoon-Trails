import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { claimDailyReward } from "../services/dailyReward.service.js";

export const claim = asyncHandler(async (req, res) => {
  const { user, streak, reward, levelUps } = await claimDailyReward(req.user);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          streak,
          reward,
          levelUps,
          balances: {
            coins: Number(user.coins),
            gems: Number(user.gems),
            xp: Number(user.xp),
            level: user.level,
          },
        },
        levelUps.length
          ? `Daily reward claimed (streak ${streak}). Leveled up to ${levelUps[levelUps.length - 1].level}!`
          : `Daily reward claimed (streak ${streak})`
      )
    );
});
