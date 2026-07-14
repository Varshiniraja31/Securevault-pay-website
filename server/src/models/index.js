import { sequelize } from "../config/db.js";
import { User } from "./User.js";
import { Wallet } from "./Wallet.js";
import { Transaction } from "./Transaction.js";
import { ScheduledPayment } from "./ScheduledPayment.js";
import { Notification } from "./Notification.js";

User.hasMany(Wallet, { foreignKey: "userId", onDelete: "CASCADE" });
Wallet.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Transaction, { foreignKey: "userId", onDelete: "CASCADE" });
Transaction.belongsTo(User, { foreignKey: "userId" });

User.hasMany(ScheduledPayment, { foreignKey: "userId", onDelete: "CASCADE" });
ScheduledPayment.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Notification, { foreignKey: "userId", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "userId" });

export { sequelize, User, Wallet, Transaction, ScheduledPayment, Notification };
