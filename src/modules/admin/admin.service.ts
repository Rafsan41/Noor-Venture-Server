import { prisma } from "../../lib/prisma";

export const adminService = {
  async getStats() {
    const [
      totalUsers, totalInvestors, totalOwners,
      totalProposals, pendingProposals, activeProposals,
      totalInvestments, totalRaised, totalProfit,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "INVESTOR" } }),
      prisma.user.count({ where: { role: "BUSINESS_OWNER" } }),
      prisma.proposal.count(),
      prisma.proposal.count({ where: { status: "PENDING" } }),
      prisma.proposal.count({ where: { status: "ACTIVE" } }),
      prisma.investment.count(),
      prisma.proposal.aggregate({ _sum: { amountRaised: true } }),
      prisma.investment.aggregate({ _sum: { profitEarned: true } }),
    ]);

    const recentProposals = await prisma.proposal.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { owner: { select: { name: true } } },
    });

    const monthlyData = await getMonthlyData();

    return {
      users: { total: totalUsers, investors: totalInvestors, owners: totalOwners },
      proposals: { total: totalProposals, pending: pendingProposals, active: activeProposals },
      investments: {
        total: totalInvestments,
        totalRaised: Number(totalRaised._sum.amountRaised ?? 0),
        totalProfit: Number(totalProfit._sum.profitEarned ?? 0),
      },
      recentProposals,
      monthlyData,
    };
  },

  async getUsers(page = 1, limit = 20, search = "", role = "") {
    const skip = (page - 1) * limit;
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(role && { role: role as any }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, role: true,
          status: true, nidVerified: true, createdAt: true, image: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  },

  async updateUserStatus(userId: string, status: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
      select: { id: true, name: true, status: true },
    });
  },

  async getPendingProposals() {
    return prisma.proposal.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
  },
};

async function getMonthlyData() {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString("default", { month: "short" }) };
  });

  const data = await Promise.all(
    months.map(async ({ year, month, label }) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const [proposals, investments] = await Promise.all([
        prisma.proposal.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.investment.aggregate({
          where: { createdAt: { gte: start, lte: end } },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      return {
        label,
        proposals,
        investments: investments._count,
        raised: Number(investments._sum.amount ?? 0),
      };
    })
  );

  return data;
}
