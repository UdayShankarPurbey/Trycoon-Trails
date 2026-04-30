import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Battle extends Model {}

Battle.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    attacker_id: { type: DataTypes.UUID, allowNull: false },
    defender_id: { type: DataTypes.UUID, allowNull: true },
    territory_id: { type: DataTypes.UUID, allowNull: false },
    attacker_strength: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    defender_strength: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    winner_id: { type: DataTypes.UUID, allowNull: true },
    territory_captured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    attacker_units: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    defender_units: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    attacker_losses: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    defender_losses: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    reputation_change: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    notes: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    modelName: "Battle",
    tableName: "battles",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["attacker_id", "created_at"], name: "battles_attacker_idx" },
      { fields: ["defender_id", "created_at"], name: "battles_defender_idx" },
      { fields: ["territory_id"], name: "battles_territory_idx" },
    ],
  }
);

export { Battle };
