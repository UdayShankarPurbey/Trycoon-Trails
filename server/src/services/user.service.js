import { User } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";

const ALLOWED_PROFILE_FIELDS = ["username"];

export const updateProfile = async (user, payload) => {
  const updates = {};
  for (const key of ALLOWED_PROFILE_FIELDS) {
    if (payload[key] !== undefined) updates[key] = payload[key];
  }
  if (updates.username) {
    const existing = await User.findOne({ where: { username: updates.username } });
    if (existing && existing.id !== user.id) {
      throw ApiError.conflict("Username already taken");
    }
  }
  Object.assign(user, updates);
  await user.save();
  return user;
};

export const updateAvatar = async (user, localFilePath) => {
  if (!localFilePath) throw ApiError.badRequest("Avatar file is required");

  const result = await uploadToCloudinary(localFilePath, "trycoon-trails/avatars");
  if (!result) throw ApiError.internal("Avatar upload failed");

  const oldPublicId = user.avatar_public_id;

  user.avatar_url = result.url;
  user.avatar_public_id = result.publicId;
  await user.save();

  if (oldPublicId) {
    deleteFromCloudinary(oldPublicId).catch(() => {});
  }

  return user;
};
