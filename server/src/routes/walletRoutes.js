import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  listWallets,
  createWallet,
  deleteWallet,
  transferBetweenWallets,
  topUpMainWallet,
  withdrawFromMainWallet,
} from "../controllers/walletController.js";

const router = Router();

router.use(requireAuth);
router.get("/", catchAsync(listWallets));
router.post("/", catchAsync(createWallet));
router.delete("/:id", catchAsync(deleteWallet));
router.post("/transfer", catchAsync(transferBetweenWallets));
router.post("/topup", catchAsync(topUpMainWallet));
router.post("/withdraw", catchAsync(withdrawFromMainWallet));

export default router;
