import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class UnitType extends Model {}

UnitType.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    name: { type: DataTypes.STRING(64), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    image_url: { type: DataTypes.STRING(500), allowNull: true },
    category: {
      type: DataTypes.ENUM("defense", "offense", "scout"),
      allowNull: false,
      defaultValue: "defense",
    },
    coin_cost: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    manpower_cost: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    attack: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    defense: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    upkeep_per_min: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    unlock_level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 4,
    },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: "UnitType",
    tableName: "unit_types",
    timestamps: true,
    underscored: true,
  }
);

export { UnitType };
