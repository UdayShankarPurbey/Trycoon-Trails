import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class BusinessType extends Model {
  costToBuy() {
    return Number(this.base_cost);
  }

  costToUpgrade(currentLevel) {
    const mult = Number(this.upgrade_cost_multiplier);
    return Math.ceil(Number(this.base_cost) * Math.pow(mult, currentLevel));
  }

  incomeAtLevel(level) {
    const mult = Number(this.upgrade_income_multiplier);
    return Number(this.base_income_per_min) * Math.pow(mult, level - 1);
  }
}

BusinessType.init(
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
    base_cost: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    base_income_per_min: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    upgrade_cost_multiplier: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 1.5,
    },
    upgrade_income_multiplier: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 1.4,
    },
    unlock_level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    max_level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 10,
    },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: "BusinessType",
    tableName: "business_types",
    timestamps: true,
    underscored: true,
  }
);

export { BusinessType };
