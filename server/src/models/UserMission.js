import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class UserMission extends Model {}

UserMission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: { type: DataTypes.UUID, allowNull: false },
    mission_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    daily_period: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "",
    },
    progress: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    claimed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    claimed_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "UserMission",
    tableName: "user_missions",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["user_id"], name: "user_missions_user_idx" },
      { fields: ["mission_id"], name: "user_missions_mission_idx" },
      {
        unique: true,
        fields: ["user_id", "mission_id", "daily_period"],
        name: "user_missions_user_mission_period_unique",
      },
    ],
  }
);

export { UserMission };
