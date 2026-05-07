import { prisma } from "../../lib/prisma";

export const walletService = {
  async getOrCreate(userId: string) {
    const existing = await prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (existing) return existing;

    return prisma.wallet.create({
      data: { userId },
      include: { transactions: true },
    });
  },

  async deposit(userId: string, amount: number) {
    if (amount <= 0) throw new Error("Amount must be positive");
    if (amount > 1000000) throw new Error("Maximum deposit is ৳10,00,000 per transaction");

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance: amount, },
      update: { balance: { increment: amount } },
    });

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: "DEPOSIT",
        amount,
        description: "Wallet top-up",
      },
    });

    return wallet;
  },

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return { transactions: [], total: 0 };

    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { walletId: wallet.id } }),
    ]);

    return { transactions, total, page, limit };
  },

  async getSummary(userId: string) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return { balance: 0, totalInvested: 0, totalEarned: 0 };
    return {
      balance: Number(wallet.balance),
      totalInvested: Number(wallet.totalInvested),
      totalEarned: Number(wallet.totalEarned),
    };
  },
};
