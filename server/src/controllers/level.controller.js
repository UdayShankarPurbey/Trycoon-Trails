import { Level } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getLevelInfo } from "../services/xp.service.js";

export const listLevels = asyncHandler(async (_req, res) => {
  const levels = await Level.findAll({ order: [["level", "ASC"]] });
  res.status(200).json(new ApiResponse(200, { levels }, "OK"));
});

export const myLevelInfo = asyncHandler(async (req, res) => {
  const info = await getLevelInfo(req.user);
  res.status(200).json(new ApiResponse(200, info, "OK"));
});
