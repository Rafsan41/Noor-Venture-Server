import { Response } from "express";
import { z }        from "zod";
import { AuthRequest } from "../../types";
import { catchAsync }  from "../../utils/catchAsync";
import { sendError, sendSuccess } from "../../utils/response";
import { aiService }   from "./ai.service";
import { prisma }      from "../../lib/prisma";

export const aiController = {
  // ── Feature 1: Analyze a proposal (accepts proposalId OR raw fields) ──────
  analyzeProposal: catchAsync(async (req: AuthRequest, res: Response) => {
    const { proposalId, ...rawFields } = req.body;

    let input: any;
    if (proposalId) {
      const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
      if (!proposal) { sendError(res, "Proposal not found", 404); return; }
      input = {
        title:              proposal.title,
        description:        proposal.description,
        businessType:       proposal.businessType,
        fundingGoal:        Number(proposal.fundingGoal),
        profitSharePercent: Number(proposal.profitSharePercent),
        duration:           proposal.duration,
        riskLevel:          proposal.riskLevel,
      };
    } else {
      input = z.object({
        title:              z.string().min(5),
        description:        z.string().min(20),
        businessType:       z.string(),
        fundingGoal:        z.coerce.number().positive(),
        profitSharePercent: z.coerce.number(),
        duration:           z.coerce.number(),
      }).parse(rawFields);
    }

    const result = await aiService.analyzeProposal(input);
    sendSuccess(res, result, "Proposal analyzed successfully");
  }),

  // ── Feature 2: Generate proposal from brief ───────────────────────────────
  generateProposal: catchAsync(async (req: AuthRequest, res: Response) => {
    const { brief } = z.object({ brief: z.string().min(20) }).parse(req.body);
    const result    = await aiService.generateProposal(brief);
    sendSuccess(res, result, "Proposal generated successfully");
  }),

  // ── Feature 3: Match investors to a proposal ──────────────────────────────
  matchInvestors: catchAsync(async (req: AuthRequest, res: Response) => {
    const { proposalId } = z.object({ proposalId: z.string() }).parse(req.body);

    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) { sendError(res, "Proposal not found", 404); return; }

    const investors = await prisma.user.findMany({
      where:  { role: "INVESTOR", status: "ACTIVE" },
      select: { id: true, name: true, wallet: { select: { balance: true } } },
      take:   15,
    });

    const result = await aiService.matchInvestors(
      {
        title:              proposal.title,
        businessType:       proposal.businessType,
        riskLevel:          proposal.riskLevel,
        profitSharePercent: Number(proposal.profitSharePercent),
        fundingGoal:        Number(proposal.fundingGoal),
      },
      investors.map((i) => ({
        id:            i.id,
        name:          i.name,
        totalInvested: Number(i.wallet?.balance ?? 0),
      }))
    );

    sendSuccess(res, result, "Investor matching complete");
  }),

  // ── Feature 4: Analyze a profit report ───────────────────────────────────
  analyzeReport: catchAsync(async (req: AuthRequest, res: Response) => {
    const { proposalId, month, year, revenue, expenses, netProfit, investorShare } =
      z.object({
        proposalId:   z.string(),
        month:        z.coerce.number().int().min(1).max(12).optional(),
        year:         z.coerce.number().int().min(2020).optional(),
        revenue:      z.coerce.number().nonnegative().optional(),
        expenses:     z.coerce.number().nonnegative().optional(),
        netProfit:    z.coerce.number().optional(),
        investorShare:z.coerce.number().nonnegative().optional(),
      }).parse(req.body);

    const proposal = await prisma.proposal.findUnique({
      where:  { id: proposalId },
      select: { title: true },
    });
    if (!proposal) { sendError(res, "Proposal not found", 404); return; }

    // Fetch latest report if no values provided
    let reportData = { month, year, revenue, expenses, netProfit, investorShare };
    if (revenue === undefined) {
      const latest = await prisma.profitReport.findFirst({
        where:   { proposalId },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });
      if (latest) {
        reportData = {
          month:         latest.month,
          year:          latest.year,
          revenue:       Number(latest.revenue),
          expenses:      Number(latest.expenses),
          netProfit:     Number(latest.netProfit),
          investorShare: Number(latest.investorShare),
        };
      }
    }

    const previousReports = await prisma.profitReport.findMany({
      where:   { proposalId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take:    6,
      select:  { month: true, year: true, revenue: true, netProfit: true },
    });

    const result = await aiService.analyzeReport({
      proposalTitle:   proposal.title,
      month:           reportData.month  ?? new Date().getMonth() + 1,
      year:            reportData.year   ?? new Date().getFullYear(),
      revenue:         reportData.revenue       ?? 0,
      expenses:        reportData.expenses      ?? 0,
      netProfit:       reportData.netProfit      ?? 0,
      investorShare:   reportData.investorShare  ?? 0,
      previousReports: previousReports.map((r) => ({
        month:     r.month,
        year:      r.year,
        revenue:   Number(r.revenue),
        netProfit: Number(r.netProfit),
      })),
    });

    sendSuccess(res, result, "Report analyzed successfully");
  }),

  // ── Feature 5: AI Chat Advisor ────────────────────────────────────────────
  chat: catchAsync(async (req: AuthRequest, res: Response) => {
    const { message, history } = z.object({
      message: z.string().min(1).max(1000),
      history: z.array(
        z.object({ role: z.enum(["user", "assistant"]), content: z.string() })
      ).optional(),
    }).parse(req.body);

    const result = await aiService.chat(message, history);
    sendSuccess(res, result, "Chat response generated");
  }),
};
