import { sequelize } from "../config/db.js";
import { User } from "./User.js";
import { logger } from "../utils/logger.js";

export const models = { User };

export const syncDB = async ({ alter = false, force = false } = {}) => {
  await sequelize.sync({ alter, force });
  logger.info(`DB sync complete (alter=${alter}, force=${force})`);
};

export { sequelize, User };
