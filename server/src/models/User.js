import { DataTypes, Model } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/db.js";

class User extends Model {
  async checkPassword(plain) {
    return bcrypt.compare(plain, this.password_hash);
  }

  toSafeJSON() {
    const { password_hash, ...rest } = this.get({ plain: true });
    return rest;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 32],
        is: /^[a-zA-Z0-9_]+$/,
      },
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
    level: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    xp: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    coins: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    gems: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    manpower: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    reputation: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    avatar_url: { type: DataTypes.STRING(500), allowNull: true },
    avatar_public_id: { type: DataTypes.STRING(255), allowNull: true },
    shield_until: { type: DataTypes.DATE, allowNull: true },
    last_active_at: { type: DataTypes.DATE, allowNull: true },
    last_daily_claim_at: { type: DataTypes.DATE, allowNull: true },
    daily_streak: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_banned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    banned_reason: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    underscored: true,
  }
);

export { User };
