// One-off migration: copies every row out of the old SQLite database into
// Firestore, preserving original IDs so cross-references (userId, fromWalletId,
// toWalletId, etc.) keep pointing at the right documents. Run with `npm run migrate`.
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../config/firebase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "..", "data", "securevault.sqlite");

const sqlite = new DatabaseSync(dbPath, { readOnly: true });

const toBool = (v) => v === 1 || v === true;

async function migrateTable(tableName, collectionName, transform) {
  const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all();
  console.log(`Migrating ${rows.length} row(s): ${tableName} -> ${collectionName}`);

  const col = db.collection(collectionName);
  for (const row of rows) {
    const data = transform(row);
    await col.doc(row.id).set(data);
  }
  console.log(`  done (${rows.length})`);
}

async function main() {
  await migrateTable("Users", "users", (row) => ({
    name: row.name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.passwordHash,
    avatarColor: row.avatarColor,
    twoFactorEnabled: toBool(row.twoFactorEnabled),
    pinEnabled: toBool(row.pinEnabled),
    pinHash: row.pinHash,
    createdAt: row.createdAt,
  }));

  await migrateTable("Wallets", "wallets", (row) => ({
    userId: row.userId,
    type: row.type,
    name: row.name,
    category: row.category,
    balance: Number(row.balance),
    budget: row.budget !== null ? Number(row.budget) : null,
    color: row.color,
    icon: row.icon,
    createdAt: row.createdAt,
  }));

  await migrateTable("Transactions", "transactions", (row) => ({
    userId: row.userId,
    type: row.type,
    fromWalletId: row.fromWalletId,
    toWalletId: row.toWalletId,
    amount: Number(row.amount),
    merchantName: row.merchantName,
    note: row.note,
    status: row.status,
    createdAt: row.createdAt,
  }));

  await migrateTable("ScheduledPayments", "scheduledPayments", (row) => ({
    userId: row.userId,
    fromWalletId: row.fromWalletId,
    payeeName: row.payeeName,
    category: row.category,
    amount: Number(row.amount),
    scheduleType: row.scheduleType,
    frequency: row.frequency,
    nextRunDate: row.nextRunDate,
    endDate: row.endDate,
    note: row.note,
    status: row.status,
    lastRunDate: row.lastRunDate,
    createdAt: row.createdAt,
  }));

  await migrateTable("Notifications", "notifications", (row) => ({
    userId: row.userId,
    title: row.title,
    message: row.message,
    type: row.type,
    isRead: toBool(row.isRead),
    createdAt: row.createdAt,
  }));

  console.log("\nMigration complete.");
  sqlite.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
