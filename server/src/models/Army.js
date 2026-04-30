import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Army extends Model {}

Army.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    owner_id: { type: DataTypes.UUID, allowNull: false },
    territory_id: { type: DataTypes.UUID, allowNull: false },
    unit_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Army",
    tableName: "armies",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["owner_id"], name: "armies_owner_idx" },
      { fields: ["territory_id"], name: "armies_territory_idx" },
      { fields: ["unit_type_id"], name: "armies_unit_type_idx" },
      {
        unique: true,
        fields: ["territory_id", "unit_type_id"],
        name: "armies_territory_unit_unique",
      },
    ],
  }
);

export { Army };
