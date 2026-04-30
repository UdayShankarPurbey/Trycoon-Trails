import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Business extends Model {}

Business.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    territory_id: { type: DataTypes.UUID, allowNull: false },
    type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    last_collected_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Business",
    tableName: "businesses",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["territory_id"], name: "businesses_territory_idx" },
      { fields: ["type_id"], name: "businesses_type_idx" },
    ],
  }
);

export { Business };
