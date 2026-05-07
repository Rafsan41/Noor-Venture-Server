import { prisma } from "../../lib/prisma";
import { UpdateProfileInput } from "./user.schema";

export const userService = {
  async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, image: true,
        role: true, status: true, bio: true, phone: true,
        nidNumber: true, nidVerified: true, createdAt: true,
        wallet: {
          select: { balance: true, totalInvested: true, totalEarned: true },
        },
        _count: {
          select: { proposals: true, investments: true },
        },
      },
    });
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    return prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true, name: true, email: true, image: true,
        role: true, bio: true, phone: true, nidNumber: true,
      },
    });
  },

  async getPublicProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, image: true, bio: true,
        role: true, createdAt: true,
        proposals: {
          where: { status: { in: ["APPROVED", "FUNDED", "ACTIVE", "COMPLETED"] } },
          select: {
            id: true, title: true, slug: true, status: true,
            category: true, amountRaised: true, fundingGoal: true, images: true,
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        },
        _count: { select: { proposals: true, investments: true } },
      },
    });
  },

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, image: true,
          role: true, status: true, nidVerified: true, createdAt: true,
        },
      }),
      prisma.user.count(),
    ]);
    return { users, total, page, limit };
  },
};
