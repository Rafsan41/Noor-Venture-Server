import { prisma } from "../../lib/prisma";
import { socketEvents } from "../../lib/socket";
import { uniqueSlug } from "../../utils/slugify";
import { ProposalQuery } from "../../types";
import { CreateProposalInput, UpdateProposalInput } from "./proposal.schema";
import { Prisma } from "@prisma/client";

export const proposalService = {
  async create(ownerId: string, input: CreateProposalInput) {
    const slug = uniqueSlug(input.title);
    const ownerSharePercent = 100 - input.profitSharePercent;

    return prisma.proposal.create({
      data: {
        ...input,
        slug,
        ownerSharePercent,
        fundingGoal: input.fundingGoal,
        minimumInvestment: input.minimumInvestment,
        profitSharePercent: input.profitSharePercent,
        deadline: new Date(input.deadline),
        ownerId,
      },
      include: { owner: { select: { id: true, name: true, image: true } } },
    });
  },

  async findAll(query: ProposalQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "12");
    const skip = (page - 1) * limit;

    const where: Prisma.ProposalWhereInput = {
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
          { category: { contains: query.search, mode: "insensitive" } },
        ],
      }),
      ...(query.category && { category: { equals: query.category, mode: "insensitive" } }),
      ...(query.status ? { status: query.status } : { status: { in: ["APPROVED", "FUNDED", "ACTIVE"] } }),
      ...(query.riskLevel && { riskLevel: query.riskLevel }),
      ...(query.minGoal && { fundingGoal: { gte: parseFloat(query.minGoal) } }),
      ...(query.maxGoal && { fundingGoal: { lte: parseFloat(query.maxGoal) } }),
    };

    const orderBy: Prisma.ProposalOrderByWithRelationInput =
      query.sort === "oldest" ? { createdAt: "asc" }
      : query.sort === "goal_asc" ? { fundingGoal: "asc" }
      : query.sort === "goal_desc" ? { fundingGoal: "desc" }
      : query.sort === "raised_desc" ? { amountRaised: "desc" }
      : { createdAt: "desc" };

    const [data, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, image: true } },
          _count: { select: { investments: true } },
        },
      }),
      prisma.proposal.count({ where }),
    ]);

    return { data, total, page, limit };
  },

  async findById(id: string) {
    return prisma.proposal.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, image: true, bio: true } },
        investments: {
          include: { investor: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        milestones: { orderBy: { dueDate: "asc" } },
        profitReports: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 6 },
        _count: { select: { investments: true } },
      },
    });
  },

  async findBySlug(slug: string) {
    return prisma.proposal.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, name: true, image: true, bio: true } },
        investments: {
          include: { investor: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        milestones: { orderBy: { dueDate: "asc" } },
        profitReports: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 6 },
        _count: { select: { investments: true } },
      },
    });
  },

  async findByOwner(ownerId: string) {
    return prisma.proposal.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { investments: true } },
        milestones: true,
      },
    });
  },

  async update(id: string, ownerId: string, input: UpdateProposalInput) {
    return prisma.proposal.update({
      where: { id, ownerId },
      data: {
        ...input,
        ...(input.deadline && { deadline: new Date(input.deadline) }),
        ...(input.profitSharePercent && {
          ownerSharePercent: 100 - input.profitSharePercent,
        }),
      },
    });
  },

  async updateStatus(id: string, status: string) {
    const proposal = await prisma.proposal.update({
      where: { id },
      data: { status: status as any },
    });

    try {
      socketEvents.proposalStatusChanged({
        proposalId: id,
        title: proposal.title,
        status,
      });
    } catch {
      // Socket errors must not break status updates
    }

    return proposal;
  },

  async updateAiData(id: string, aiScore: number, aiAnalysis: object, aiTags: string[]) {
    return prisma.proposal.update({
      where: { id },
      data: { aiScore, aiAnalysis, aiTags },
    });
  },

  async getCategories() {
    const results = await prisma.proposal.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });
    return results.map((r) => ({ name: r.category, count: r._count.category }));
  },

  async getStats() {
    const [total, funded, active, totalRaised] = await Promise.all([
      prisma.proposal.count(),
      prisma.proposal.count({ where: { status: { in: ["FUNDED", "ACTIVE", "COMPLETED"] } } }),
      prisma.proposal.count({ where: { status: "ACTIVE" } }),
      prisma.proposal.aggregate({ _sum: { amountRaised: true } }),
    ]);
    return {
      total,
      funded,
      active,
      totalRaised: totalRaised._sum.amountRaised ?? 0,
    };
  },
};
