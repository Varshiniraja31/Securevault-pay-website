import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Transaction = sequelize.define("Transaction", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: { type: DataTypes.UUID, allowNull: false },
  type: {
    type: DataTypes.ENUM(
      "topup",
      "withdrawal",
      "wallet_transfer",
      "merchant_payment",
      "qr_payment",
      "bill_payment",
      "scheduled_payment",
      "received"
    ),
    allowNull: false,
  },
  fromWalletId: { type: DataTypes.UUID, allowNull: true },
  toWalletId: { type: DataTypes.UUID, allowNull: true },
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  merchantName: { type: DataTypes.STRING, allowNull: true },
  note: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.ENUM("success", "failed", "pending"),
    defaultValue: "success",
  },
});
