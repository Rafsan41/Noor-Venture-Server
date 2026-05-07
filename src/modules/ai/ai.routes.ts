import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import { aiLimiter } from "../../middleware/rateLimiter.middleware";
import { aiController } from "./ai.controller";

const router = Router();

// All AI routes are protected + rate-limited
router.use(protect, aiLimiter);

router.post("/analyze-proposal", aiController.analyzeProposal);
router.post("/generate-proposal", aiController.generateProposal);
router.post("/match-investors",   aiController.matchInvestors);
router.post("/analyze-report",    aiController.analyzeReport);
router.post("/chat",              aiController.chat);

export default router;
