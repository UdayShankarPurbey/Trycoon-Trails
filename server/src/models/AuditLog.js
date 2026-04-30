import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(64), allowNull: false },
    target_table: { type: DataTypes.STRING(64), allowNull: false },
    target_id: { type: DataTypes.STRING(64), allowNull: true },
    payload: { type: DataTypes.JSON, allowNull: true },
    ip: { type: DataTypes.STRING(64), allowNull: true },
  },
  {
    sequelize,
    modelName: "AuditLog",
    tableName: "admin_audit_log",
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ["admin_id", "created_at"], name: "audit_admin_idx" },
      { fields: ["action"], name: "audit_action_idx" },
      { fields: ["target_table", "target_id"], name: "audit_target_idx" },
    ],
  }
);

export { AuditLog };
