import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Territory extends Model {
  isOwned() {
    return !!this.owner_id;
  }

  isInCooldown(now = new Date()) {
    return this.capture_cooldown_until && new Date(this.capture_cooldown_until) > now;
  }
}

Territory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    x: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    y: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(64), allowNull: false },
    terrain: {
      type: DataTypes.ENUM("plains", "forest", "mountain", "coast", "desert"),
      allowNull: false,
      defaultValue: "plains",
    },
    business_capacity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 3,
    },
    defense_bonus: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    income_multiplier: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 1.0,
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    captured_at: { type: DataTypes.DATE, allowNull: true },
    capture_cooldown_until: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "Territory",
    tableName: "territories",
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ["x", "y"], name: "territories_xy_unique" },
      { fields: ["owner_id"], name: "territories_owner_idx" },
    ],
  }
);

export { Territory };
