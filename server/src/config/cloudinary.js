import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

export const uploadToCloudinary = async (localFilePath, folder = "trycoon-trails") => {
  if (!localFilePath) return null;

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: "auto",
    });

    await fs.unlink(localFilePath).catch(() => {});

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (err) {
    logger.error(`Cloudinary upload failed: ${err.message}`);
    await fs.unlink(localFilePath).catch(() => {});
    return null;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (err) {
    logger.error(`Cloudinary delete failed: ${err.message}`);
    return false;
  }
};

export { cloudinary };
