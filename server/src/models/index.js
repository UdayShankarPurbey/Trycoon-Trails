import { sequelize } from "../config/db.js";
import { User } from "./User.js";
import { Level } from "./Level.js";
import { Transaction } from "./Transaction.js";
import { logger } from "../utils/logger.js";

User.hasMany(Transaction, { foreignKey: "user_id", as: "transactions", onDelete: "CASCADE" });
Transaction.belongsTo(User, { foreignKey: "user_id", as: "user" });

export const models = { User, Level, Transaction };

export const syncDB = async ({ alter = false, force = false } = {}) => {
  await sequelize.sync({ alter, force });
  logger.info(`DB sync complete (alter=${alter}, force=${force})`);
};

export { sequelize, User, Level, Transaction };
