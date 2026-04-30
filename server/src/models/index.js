import { sequelize } from "../config/db.js";
import { User } from "./User.js";
import { Level } from "./Level.js";
import { Transaction } from "./Transaction.js";
import { Territory } from "./Territory.js";
import { BusinessType } from "./BusinessType.js";
import { Business } from "./Business.js";
import { UnitType } from "./UnitType.js";
import { Army } from "./Army.js";
import { Battle } from "./Battle.js";
import { Mission } from "./Mission.js";
import { UserMission } from "./UserMission.js";
import { AuditLog } from "./AuditLog.js";
import { logger } from "../utils/logger.js";

User.hasMany(Transaction, { foreignKey: "user_id", as: "transactions", onDelete: "CASCADE" });
Transaction.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Territory, { foreignKey: "owner_id", as: "territories" });
Territory.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

Territory.hasMany(Business, { foreignKey: "territory_id", as: "businesses", onDelete: "CASCADE" });
Business.belongsTo(Territory, { foreignKey: "territory_id", as: "territory" });

BusinessType.hasMany(Business, { foreignKey: "type_id", as: "instances" });
Business.belongsTo(BusinessType, { foreignKey: "type_id", as: "type" });

User.hasMany(Army, { foreignKey: "owner_id", as: "armies", onDelete: "CASCADE" });
Army.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

Territory.hasMany(Army, { foreignKey: "territory_id", as: "armies", onDelete: "CASCADE" });
Army.belongsTo(Territory, { foreignKey: "territory_id", as: "territory" });

UnitType.hasMany(Army, { foreignKey: "unit_type_id", as: "instances" });
Army.belongsTo(UnitType, { foreignKey: "unit_type_id", as: "unit_type" });

User.hasMany(Battle, { foreignKey: "attacker_id", as: "attackingBattles" });
User.hasMany(Battle, { foreignKey: "defender_id", as: "defendingBattles" });
Battle.belongsTo(User, { foreignKey: "attacker_id", as: "attacker" });
Battle.belongsTo(User, { foreignKey: "defender_id", as: "defender" });

Territory.hasMany(Battle, { foreignKey: "territory_id", as: "battles" });
Battle.belongsTo(Territory, { foreignKey: "territory_id", as: "territory" });

User.hasMany(UserMission, { foreignKey: "user_id", as: "userMissions", onDelete: "CASCADE" });
UserMission.belongsTo(User, { foreignKey: "user_id", as: "user" });

Mission.hasMany(UserMission, { foreignKey: "mission_id", as: "userInstances" });
UserMission.belongsTo(Mission, { foreignKey: "mission_id", as: "mission" });

User.hasMany(AuditLog, { foreignKey: "admin_id", as: "auditEntries" });
AuditLog.belongsTo(User, { foreignKey: "admin_id", as: "admin" });

export const models = {
  User, Level, Transaction, Territory, BusinessType, Business,
  UnitType, Army, Battle, Mission, UserMission, AuditLog,
};

export const syncDB = async ({ alter = false, force = false } = {}) => {
  await sequelize.sync({ alter, force });
  logger.info(`DB sync complete (alter=${alter}, force=${force})`);
};

export {
  sequelize, User, Level, Transaction, Territory, BusinessType, Business,
  UnitType, Army, Battle, Mission, UserMission, AuditLog,
};
