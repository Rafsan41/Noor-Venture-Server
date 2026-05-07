import { Router } from "express";
import { protect, requireAdmin } from "../../middleware/auth.middleware";
import { adminController } from "./admin.controller";

const router = Router();

router.use(protect, requireAdmin);

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.get("/proposals/pending", adminController.getPendingProposals);

export default router;
