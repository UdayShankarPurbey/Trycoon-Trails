import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const seedAdmin = async () => {
  const { username, email, password } = env.admin;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      logger.info(`Admin seed: promoted ${email} to admin`);
    } else {
      logger.debug(`Admin seed: ${email} already exists`);
    }
    return existing;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    username,
    email,
    password_hash,
    role: "admin",
    level: 10,
    xp: 0,
    coins: 0,
    gems: 0,
    manpower: 0,
    reputation: 0,
    last_active_at: new Date(),
  });
  logger.info(`Admin seed: created ${admin.email} (${admin.id})`);
  return admin;
};
