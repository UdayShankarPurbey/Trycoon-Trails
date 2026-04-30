import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Level extends Model {}

Level.init(
  {
    level: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    title: { type: DataTypes.STRING(64), allowNull: false },
    xp_required: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    reward_coins: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    reward_gems: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    unlocks: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: "Level",
    tableName: "levels",
    timestamps: false,
    underscored: true,
  }
);

export { Level };
