import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  avatarColor: { type: DataTypes.STRING, defaultValue: "#6C5CE7" },
  twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  pinHash: { type: DataTypes.STRING, allowNull: true },
  pinEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
});
