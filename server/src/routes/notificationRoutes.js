import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";

const router = Router();

router.use(requireAuth);
router.get("/", catchAsync(listNotifications));
router.patch("/read-all", catchAsync(markAllNotificationsRead));
router.patch("/:id/read", catchAsync(markNotificationRead));

export default router;
