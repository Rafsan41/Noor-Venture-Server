import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../types";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess } from "../../utils/response";
import { walletService } from "./wallet.service";

const depositSchema = z.object({ amount: z.number().positive() });

export const walletController = {
  getWallet: catchAsync(async (req: AuthRequest, res: Response) => {
    const wallet = await walletService.getOrCreate(req.user!.id);
    sendSuccess(res, wallet);
  }),

  deposit: catchAsync(async (req: AuthRequest, res: Response) => {
    const { amount } = depositSchema.parse(req.body);
    const wallet = await walletService.deposit(req.user!.id, amount);
    sendSuccess(res, wallet, `৳${amount} deposited successfully`);
  }),

  getTransactions: catchAsync(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string || "1");
    const limit = parseInt(req.query.limit as string || "20");
    const result = await walletService.getTransactions(req.user!.id, page, limit);
    sendSuccess(res, result);
  }),

  getSummary: catchAsync(async (req: AuthRequest, res: Response) => {
    const summary = await walletService.getSummary(req.user!.id);
    sendSuccess(res, summary);
  }),
};
