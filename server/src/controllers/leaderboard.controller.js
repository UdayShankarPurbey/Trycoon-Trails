import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getTop, getUserRank } from "../services/leaderboard.service.js";

const VALID_KINDS = ["coins", "gems", "xp", "level", "reputation", "battles_won"];

export const top = asyncHandler(async (req, res) => {
  const kind = req.params.kind;
  if (!VALID_KINDS.includes(kind)) {
    throw ApiError.badRequest(`kind must be one of: ${VALID_KINDS.join(", ")}`);
  }
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const offset = parseInt(req.query.offset, 10) || 0;
  const items = await getTop(kind, { limit, offset });
  res.status(200).json(new ApiResponse(200, { kind, limit, offset, items }, "OK"));
});

export const myRank = asyncHandler(async (req, res) => {
  const kind = req.params.kind;
  if (!VALID_KINDS.includes(kind)) {
    throw ApiError.badRequest(`kind must be one of: ${VALID_KINDS.join(", ")}`);
  }
  const rank = await getUserRank(req.user.id, kind);
  res.status(200).json(new ApiResponse(200, { kind, ...(rank || { rank: null, score: null }) }, "OK"));
});
