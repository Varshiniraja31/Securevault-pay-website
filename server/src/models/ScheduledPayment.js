import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const ScheduledPayment = sequelize.define("ScheduledPayment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: { type: DataTypes.UUID, allowNull: false },
  fromWalletId: { type: DataTypes.UUID, allowNull: false },
  payeeName: { type: DataTypes.STRING, allowNull: false },
  category: {
    type: DataTypes.STRING,
    defaultValue: "custom",
  },
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  scheduleType: {
    type: DataTypes.ENUM("one-time", "recurring"),
    allowNull: false,
    defaultValue: "one-time",
  },
  frequency: {
    type: DataTypes.ENUM("daily", "weekly", "monthly", "yearly"),
    allowNull: true,
  },
  nextRunDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  note: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.ENUM("active", "paused", "completed", "cancelled"),
    defaultValue: "active",
  },
  lastRunDate: { type: DataTypes.DATEONLY, allowNull: true },
});
