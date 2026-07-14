import { Router } from "express";
import { register, login, me, updateMe, setPin, disablePin, verifyPinLogin } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { catchAsync } from "../utils/catchAsync.js";

const router = Router();

router.post("/register", catchAsync(register));
router.post("/login", catchAsync(login));
router.get("/me", requireAuth, catchAsync(me));
router.patch("/me", requireAuth, catchAsync(updateMe));
router.post("/verify-pin", catchAsync(verifyPinLogin));
router.post("/pin", requireAuth, catchAsync(setPin));
router.delete("/pin", requireAuth, catchAsync(disablePin));

export default router;
