import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess } from "../../utils/response";
import { prisma } from "../../lib/prisma";

const router = Router();

// Public live stats — used by landing page ticker & dashboard
router.get("/live", catchAsync(async (_req, res) => {
  const [
    totalRaised,
    totalInvestors,
    totalProposals,
    activeProposals,
    fundedProposals,
    completedProposals,
    totalProfitDistributed,
  ] = await Promise.all([
    prisma.proposal.aggregate({ _sum: { amountRaised: true } }),
    prisma.user.count({ where: { role: "INVESTOR" } }),
    prisma.proposal.count(),
    prisma.proposal.count({ where: { status: "ACTIVE" } }),
    prisma.proposal.count({ where: { status: { in: ["FUNDED", "ACTIVE", "COMPLETED"] } } }),
    prisma.proposal.count({ where: { status: "COMPLETED" } }),
    prisma.investment.aggregate({ _sum: { profitEarned: true } }),
  ]);

  sendSuccess(res, {
    totalRaised:            Number(totalRaised._sum.amountRaised ?? 0),
    totalInvestors,
    totalProposals,
    activeProposals,
    fundedProposals,
    completedProposals,
    totalProfitDistributed: Number(totalProfitDistributed._sum.profitEarned ?? 0),
    updatedAt:              new Date().toISOString(),
  });
}));

export default router;
