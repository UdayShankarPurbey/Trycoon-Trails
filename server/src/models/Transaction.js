import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Transaction extends Model {}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    kind: {
      type: DataTypes.ENUM("coins", "gems", "manpower", "reputation", "xp"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    balance_after: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Transaction",
    tableName: "transactions",
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ["user_id", "created_at"] },
      { fields: ["kind"] },
    ],
  }
);

export { Transaction };
