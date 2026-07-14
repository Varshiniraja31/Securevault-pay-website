import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.STRING, allowNull: false },
  type: {
    type: DataTypes.ENUM("payment", "schedule", "wallet", "system"),
    defaultValue: "system",
  },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
});
