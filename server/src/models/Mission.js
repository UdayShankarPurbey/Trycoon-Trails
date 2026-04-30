import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Mission extends Model {}

Mission.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM("daily", "story", "achievement"),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(128), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    goal_type: {
      type: DataTypes.ENUM(
        "buy_business",
        "upgrade_business",
        "recruit_units",
        "win_battle",
        "capture_territory",
        "reach_level"
      ),
      allowNull: false,
    },
    goal_mode: {
      type: DataTypes.ENUM("add", "max"),
      allowNull: false,
      defaultValue: "add",
    },
    goal_value: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    reward_coins: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    reward_gems: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    reward_xp: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    required_level: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 100 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: "Mission",
    tableName: "missions",
    timestamps: true,
    underscored: true,
  }
);

export { Mission };
