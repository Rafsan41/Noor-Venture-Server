import { prisma } from "../../lib/prisma";
import { socketEvents } from "../../lib/socket";
import { CreateInvestmentInput } from "./investment.schema";

export const investmentService = {
  async invest(investorId: string, input: CreateInvestmentInput) {
    const { proposalId, amount } = input;

    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new Error("Proposal not found");
    if (!["APPROVED", "ACTIVE"].includes(proposal.status)) {
      throw new Error("This proposal is not accepting investments");
    }
    if (amount < Number(proposal.minimumInvestment)) {
      throw new Error(`Minimum investment is ৳${proposal.minimumInvestment}`);
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: investorId } });
    if (!wallet || Number(wallet.balance) < amount) {
      throw new Error("Insufficient wallet balance");
    }

    const sharePercent =
      (amount / Number(proposal.fundingGoal)) * Number(proposal.profitSharePercent);

    const newAmountRaised = Number(proposal.amountRaised) + amount;
    const isFunded = newAmountRaised >= Number(proposal.fundingGoal);

    const [investment] = await prisma.$transaction([
      prisma.investment.create({
        data: {
          investorId,
          proposalId,
          amount,
          sharePercent,
        },
        include: {
          proposal: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.proposal.update({
        where: { id: proposalId },
        data: {
          amountRaised: newAmountRaised,
          totalInvestors: { increment: 1 },
          ...(isFunded && { status: "FUNDED" }),
        },
      }),
      prisma.wallet.update({
        where: { userId: investorId },
        data: {
          balance: { decrement: amount },
          totalInvested: { increment: amount },
        },
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: "INVESTMENT",
          amount,
          description: `Invested in ${proposal.title}`,
          reference: proposalId,
        },
      }),
    ]);

    // ── Real-time events ────────────────────────────────────────────
    const progressPercent = Math.min(
      Math.round((newAmountRaised / Number(proposal.fundingGoal)) * 100),
      100
    );

    try {
      socketEvents.newInvestment({
        proposalId,
        proposalTitle: proposal.title,
        investorName: "An investor",
        amount,
        newAmountRaised,
        fundingGoal: Number(proposal.fundingGoal),
        progressPercent,
      });

      if (isFunded) {
        socketEvents.proposalFunded({
          proposalId,
          title: proposal.title,
          totalRaised: newAmountRaised,
          totalInvestors: proposal.totalInvestors + 1,
        });
      }

      // Broadcast updated platform stats
      const [totalRaised, totalInvestors, activeProposals, totalProposals] =
        await Promise.all([
          prisma.proposal.aggregate({ _sum: { amountRaised: true } }),
          prisma.user.count({ where: { role: "INVESTOR" } }),
          prisma.proposal.count({ where: { status: "ACTIVE" } }),
          prisma.proposal.count(),
        ]);

      socketEvents.statsUpdate({
        totalRaised: Number(totalRaised._sum.amountRaised ?? 0),
        totalInvestors,
        activeProposals,
        totalProposals,
      });
    } catch {
      // Socket errors must not break the investment flow
    }

    return investment;
  },

  async getPortfolio(investorId: string) {
    const investments = await prisma.investment.findMany({
      where: { investorId },
      include: {
        proposal: {
          select: {
            id: true, title: true, slug: true, category: true,
            status: true, profitSharePercent: true, fundingGoal: true,
            amountRaised: true, images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalInvested = investments.reduce((s, i) => s + Number(i.amount), 0);
    const totalEarned = investments.reduce((s, i) => s + Number(i.profitEarned), 0);
    const active = investments.filter((i) => i.status === "ACTIVE").length;

    return { investments, summary: { totalInvested, totalEarned, active, total: investments.length } };
  },

  async getById(id: string, investorId: string) {
    return prisma.investment.findFirst({
      where: { id, investorId },
      include: {
        proposal: true,
      },
    });
  },

  async distributeProfit(proposalId: string, investorShare: number, proposalTitle = "Business") {
    const investments = await prisma.investment.findMany({
      where: { proposalId, status: "ACTIVE" },
      include: { investor: { include: { wallet: true } } },
    });

    const totalInvested = investments.reduce((s, i) => s + Number(i.amount), 0);

    const now = new Date();
    const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

    await prisma.$transaction(
      investments.flatMap((inv) => {
        const proportion = Number(inv.amount) / totalInvested;
        const profit = Math.round(investorShare * proportion * 100) / 100;

        return [
          prisma.investment.update({
            where: { id: inv.id },
            data: { profitEarned: { increment: profit } },
          }),
          prisma.wallet.update({
            where: { userId: inv.investorId },
            data: {
              balance: { increment: profit },
              totalEarned: { increment: profit },
            },
          }),
          prisma.transaction.create({
            data: {
              walletId: inv.investor.wallet!.id,
              type: "PROFIT",
              amount: profit,
              description: `Profit distribution`,
              reference: proposalId,
            },
          }),
        ];
      })
    );

    try {
      socketEvents.profitDistributed({
        proposalId,
        proposalTitle,
        totalDistributed: investorShare,
        month: monthName,
      });
    } catch {
      // Socket errors must not break profit distribution
    }
  },
};
