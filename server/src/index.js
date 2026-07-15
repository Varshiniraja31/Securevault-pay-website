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

// CLIENT_ORIGIN accepts one origin or a comma-separated list (production domain,
// Vercel preview URLs, local dev), so a single env var covers every environment.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
  })
);
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
