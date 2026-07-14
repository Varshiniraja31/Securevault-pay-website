// Additive, idempotent column migrations for SQLite. Deliberately avoids
// Sequelize's `sync({ alter: true })`, which can rebuild whole tables (DROP +
// recreate) on this dialect and risks existing data when foreign keys are
// involved. Plain ADD COLUMN is a safe, non-destructive operation.
export async function ensureColumn(sequelize, table, column, ddl) {
  try {
    await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${ddl}`);
    console.log(`Migration: added ${table}.${column}`);
  } catch (err) {
    if (!/duplicate column name/i.test(err.message)) throw err;
  }
}
