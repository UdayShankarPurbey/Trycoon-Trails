import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Notification extends Model {}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: { type: DataTypes.UUID, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        "battle_attacked",
        "battle_defended",
        "territory_captured",
        "mission_complete",
        "level_up",
        "admin_grant",
        "admin_message",
        "system"
      ),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(128), allowNull: false },
    body: { type: DataTypes.STRING(500), allowNull: true },
    data: { type: DataTypes.JSON, allowNull: true },
    is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    read_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "notifications",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["user_id", "is_read", "created_at"], name: "notifications_user_unread_idx" },
    ],
  }
);

export { Notification };
