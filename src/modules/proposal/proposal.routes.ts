import { Router } from "express";
import { protect, requireAdmin, requireOwner } from "../../middleware/auth.middleware";
import { proposalController } from "./proposal.controller";

const router = Router();

// Public
router.get("/",             proposalController.getAll);
router.get("/stats",        proposalController.getStats);
router.get("/categories",   proposalController.getCategories);
router.get("/slug/:slug",   proposalController.getBySlug);
router.get("/:id",          proposalController.getById);

// Business Owner
router.post("/",              protect, requireOwner, proposalController.create);
router.get("/my/list",        protect, requireOwner, proposalController.getMyProposals);
router.patch("/:id",          protect, requireOwner, proposalController.update);

// Admin only
router.patch("/:id/status",   protect, requireAdmin, proposalController.updateStatus);

export default router;
