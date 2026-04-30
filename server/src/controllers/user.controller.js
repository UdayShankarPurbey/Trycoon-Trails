import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { isUsername } from "../utils/validators.js";
import { updateProfile, updateAvatar } from "../services/user.service.js";

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user.toSafeJSON() }, "OK"));
});

export const patchMe = asyncHandler(async (req, res) => {
  const { username } = req.body || {};
  if (username !== undefined && !isUsername(username)) {
    throw ApiError.unprocessable("Username must be 3-32 chars, letters/digits/underscore");
  }
  const user = await updateProfile(req.user, { username });
  res.status(200).json(new ApiResponse(200, { user: user.toSafeJSON() }, "Profile updated"));
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("Avatar file is required");
  const user = await updateAvatar(req.user, req.file.path);
  res.status(200).json(new ApiResponse(200, { user: user.toSafeJSON() }, "Avatar updated"));
});
