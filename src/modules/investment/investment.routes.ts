import { Router } from "express";
import { protect, requireInvestor } from "../../middleware/auth.middleware";
import { investmentController } from "./investment.controller";

const router = Router();

router.post("/",          protect, requireInvestor, investmentController.invest);
router.get("/portfolio",  protect, requireInvestor, investmentController.getPortfolio);
router.get("/:id",        protect, requireInvestor, investmentController.getById);

export default router;
