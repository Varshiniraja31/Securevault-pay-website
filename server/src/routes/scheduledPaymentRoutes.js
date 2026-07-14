import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  listScheduledPayments,
  createScheduledPayment,
  updateScheduledPayment,
  updateScheduledPaymentStatus,
  deleteScheduledPayment,
} from "../controllers/scheduledPaymentController.js";

const router = Router();

router.use(requireAuth);
router.get("/", catchAsync(listScheduledPayments));
router.post("/", catchAsync(createScheduledPayment));
router.patch("/:id", catchAsync(updateScheduledPayment));
router.patch("/:id/status", catchAsync(updateScheduledPaymentStatus));
router.delete("/:id", catchAsync(deleteScheduledPayment));

export default router;
