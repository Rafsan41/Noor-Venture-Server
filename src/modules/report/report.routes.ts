import { Router } from "express";
import { protect, requireOwner } from "../../middleware/auth.middleware";
import { reportController } from "./report.controller";

const router = Router();

router.post("/",                          protect, requireOwner, reportController.create);
router.get("/my",                         protect, requireOwner, reportController.getMyReports);
router.get("/proposal/:proposalId",       protect,               reportController.getByProposal);
router.get("/:id",                        protect,               reportController.getById);

export default router;
