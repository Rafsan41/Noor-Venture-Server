import { Response } from "express";
import { AuthRequest } from "../../types";
import { catchAsync } from "../../utils/catchAsync";
import { sendError, sendSuccess } from "../../utils/response";
import { investmentService } from "./investment.service";
import { createInvestmentSchema } from "./investment.schema";

export const investmentController = {
  invest: catchAsync(async (req: AuthRequest, res: Response) => {
    const input = createInvestmentSchema.parse(req.body);
    const investment = await investmentService.invest(req.user!.id, input);
    sendSuccess(res, investment, "Investment successful!", 201);
  }),

  getPortfolio: catchAsync(async (req: AuthRequest, res: Response) => {
    const portfolio = await investmentService.getPortfolio(req.user!.id);
    sendSuccess(res, portfolio);
  }),

  getById: catchAsync(async (req: AuthRequest, res: Response) => {
    const investment = await investmentService.getById(req.params.id, req.user!.id);
    if (!investment) { sendError(res, "Investment not found", 404); return; }
    sendSuccess(res, investment);
  }),
};
