import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import { userController } from "./user.controller";

const router = Router();

router.get("/me",          protect, userController.getMe);
router.patch("/me",        protect, userController.updateMe);
router.get("/:id/public",          userController.getPublicProfile);

export default router;
