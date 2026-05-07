import { prisma } from "../../lib/prisma";
import { investmentService } from "../investment/investment.service";
import { CreateReportInput } from "./report.schema";

export const reportService = {
  async create(submittedById: string, input: CreateReportInput) {
    const { proposalId, month, year, revenue, expenses, notes } = input;

    // Verify the submitter owns this proposal
    const proposal = await prisma.proposal.findFirst({
      where: { id: proposalId, ownerId: submittedById },
    });
    if (!proposal) throw new Error("Proposal not found or unauthorized");

    const netProfit = revenue - expenses;
    const investorShare =
      netProfit > 0
        ? Math.round(netProfit * (Number(proposal.profitSharePercent) / 100) * 100) / 100
        : 0;

    const report = await prisma.profitReport.create({
      data: {
        proposalId,
        submittedById,
        month,
        year,
        revenue,
        expenses,
        netProfit,
        investorShare,
        notes,
      },
    });

    // Auto-distribute profit to investors if there's a positive investor share
    if (investorShare > 0) {
      await investmentService.distributeProfit(proposalId, investorShare, proposal.title);
    }

    return { report, netProfit, investorShare };
  },

  async getByProposal(proposalId: string) {
    return prisma.profitReport.findMany({
      where: { proposalId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        submittedBy: { select: { id: true, name: true } },
      },
    });
  },

  async getMyReports(ownerId: string) {
    return prisma.profitReport.findMany({
      where: { proposal: { ownerId } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        proposal: { select: { id: true, title: true, slug: true } },
      },
    });
  },

  async getById(id: string) {
    return prisma.profitReport.findUnique({
      where: { id },
      include: {
        proposal: { select: { id: true, title: true, profitSharePercent: true } },
        submittedBy: { select: { id: true, name: true } },
      },
    });
  },

  async saveAiInsights(id: string, aiInsights: object) {
    return prisma.profitReport.update({
      where: { id },
      data: { aiInsights },
    });
  },
};
