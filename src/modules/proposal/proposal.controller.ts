import { Response } from "express";
import { AuthRequest, ProposalQuery } from "../../types";
import { catchAsync } from "../../utils/catchAsync";
import { sendError, sendPaginated, sendSuccess } from "../../utils/response";
import { proposalService } from "./proposal.service";
import { createProposalSchema, updateProposalSchema, updateStatusSchema } from "./proposal.schema";

export const proposalController = {
  create: catchAsync(async (req: AuthRequest, res: Response) => {
    const input = createProposalSchema.parse(req.body);
    const proposal = await proposalService.create(req.user!.id, input);
    sendSuccess(res, proposal, "Proposal submitted successfully", 201);
  }),

  getAll: catchAsync(async (req: AuthRequest, res: Response) => {
    const query = req.query as ProposalQuery;
    const { data, total, page, limit } = await proposalService.findAll(query);
    sendPaginated(res, data, total, page, limit);
  }),

  getById: catchAsync(async (req: AuthRequest, res: Response) => {
    const proposal = await proposalService.findById(req.params.id);
    if (!proposal) { sendError(res, "Proposal not found", 404); return; }
    sendSuccess(res, proposal);
  }),

  getBySlug: catchAsync(async (req: AuthRequest, res: Response) => {
    const proposal = await proposalService.findBySlug(req.params.slug);
    if (!proposal) { sendError(res, "Proposal not found", 404); return; }
    sendSuccess(res, proposal);
  }),

  getMyProposals: catchAsync(async (req: AuthRequest, res: Response) => {
    const proposals = await proposalService.findByOwner(req.user!.id);
    sendSuccess(res, proposals);
  }),

  update: catchAsync(async (req: AuthRequest, res: Response) => {
    const input = updateProposalSchema.parse(req.body);
    const proposal = await proposalService.update(req.params.id, req.user!.id, input);
    sendSuccess(res, proposal, "Proposal updated");
  }),

  updateStatus: catchAsync(async (req: AuthRequest, res: Response) => {
    const { status } = updateStatusSchema.parse(req.body);
    const proposal = await proposalService.updateStatus(req.params.id, status);
    sendSuccess(res, proposal, `Proposal ${status.toLowerCase()}`);
  }),

  getCategories: catchAsync(async (_req: AuthRequest, res: Response) => {
    const categories = await proposalService.getCategories();
    sendSuccess(res, categories);
  }),

  getStats: catchAsync(async (_req: AuthRequest, res: Response) => {
    const stats = await proposalService.getStats();
    sendSuccess(res, stats);
  }),
};
