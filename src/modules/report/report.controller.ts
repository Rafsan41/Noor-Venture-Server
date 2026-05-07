import { Response } from "express";
import { AuthRequest } from "../../types";
import { catchAsync } from "../../utils/catchAsync";
import { sendError, sendSuccess } from "../../utils/response";
import { reportService } from "./report.service";
import { createReportSchema } from "./report.schema";

export const reportController = {
  create: catchAsync(async (req: AuthRequest, res: Response) => {
    const input = createReportSchema.parse(req.body);
    const result = await reportService.create(req.user!.id, input);
    sendSuccess(res, result, "Report submitted & profit distributed", 201);
  }),

  getByProposal: catchAsync(async (req: AuthRequest, res: Response) => {
    const reports = await reportService.getByProposal(req.params.proposalId);
    sendSuccess(res, reports);
  }),

  getMyReports: catchAsync(async (req: AuthRequest, res: Response) => {
    const reports = await reportService.getMyReports(req.user!.id);
    sendSuccess(res, reports);
  }),

  getById: catchAsync(async (req: AuthRequest, res: Response) => {
    const report = await reportService.getById(req.params.id);
    if (!report) { sendError(res, "Report not found", 404); return; }
    sendSuccess(res, report);
  }),
};
