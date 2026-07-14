import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { catchAsync } from "../utils/catchAsync.js";
import { makePayment, listTransactions } from "../controllers/paymentController.js";

const router = Router();

router.use(requireAuth);
router.post("/pay", catchAsync(makePayment));
router.get("/transactions", catchAsync(listTransactions));

export default router;
