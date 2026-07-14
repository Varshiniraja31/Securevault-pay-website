import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Wallet = sequelize.define("Wallet", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: { type: DataTypes.UUID, allowNull: false },
  type: {
    type: DataTypes.ENUM("main", "purpose"),
    allowNull: false,
    defaultValue: "purpose",
  },
  name: { type: DataTypes.STRING, allowNull: false },
  category: {
    type: DataTypes.STRING,
    defaultValue: "custom",
  },
  balance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  budget: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  color: { type: DataTypes.STRING, defaultValue: "#6C5CE7" },
  icon: { type: DataTypes.STRING, defaultValue: "wallet" },
});
