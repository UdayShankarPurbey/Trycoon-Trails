import { sequelize } from "../config/db.js";
import { User } from "./User.js";
import { Level } from "./Level.js";
import { Transaction } from "./Transaction.js";
import { Territory } from "./Territory.js";
import { BusinessType } from "./BusinessType.js";
import { Business } from "./Business.js";
import { logger } from "../utils/logger.js";

User.hasMany(Transaction, { foreignKey: "user_id", as: "transactions", onDelete: "CASCADE" });
Transaction.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Territory, { foreignKey: "owner_id", as: "territories" });
Territory.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

Territory.hasMany(Business, { foreignKey: "territory_id", as: "businesses", onDelete: "CASCADE" });
Business.belongsTo(Territory, { foreignKey: "territory_id", as: "territory" });

BusinessType.hasMany(Business, { foreignKey: "type_id", as: "instances" });
Business.belongsTo(BusinessType, { foreignKey: "type_id", as: "type" });

export const models = { User, Level, Transaction, Territory, BusinessType, Business };

export const syncDB = async ({ alter = false, force = false } = {}) => {
  await sequelize.sync({ alter, force });
  logger.info(`DB sync complete (alter=${alter}, force=${force})`);
};

export { sequelize, User, Level, Transaction, Territory, BusinessType, Business };
