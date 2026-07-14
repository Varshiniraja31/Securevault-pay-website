import "dotenv/config";
import express from "express";
import cors from "cors";
import { startScheduler } from "./jobs/scheduler.js";

import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import scheduledPaymentRoutes from "./routes/scheduledPaymentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/scheduled-payments", scheduledPaymentRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong" });
});

function start() {
  startScheduler();
  app.listen(PORT, () => {
    console.log(`SecureVault Pay API (Firestore) running on http://localhost:${PORT}`);
  });
}

start();
