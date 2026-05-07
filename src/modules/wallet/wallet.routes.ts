import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import { walletController } from "./wallet.controller";

const router = Router();

router.get("/",             protect, walletController.getWallet);
router.get("/summary",      protect, walletController.getSummary);
router.get("/transactions", protect, walletController.getTransactions);
router.post("/deposit",     protect, walletController.deposit);

export default router;
