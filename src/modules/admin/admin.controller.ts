import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../types";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess } from "../../utils/response";
import { adminService } from "./admin.service";

const updateStatusSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]) });

export const adminController = {
  getStats: catchAsync(async (_req: AuthRequest, res: Response) => {
    const stats = await adminService.getStats();
    sendSuccess(res, stats, "Admin stats loaded");
  }),

  getUsers: catchAsync(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string || "1");
    const limit = parseInt(req.query.limit as string || "20");
    const search = (req.query.search as string) || "";
    const role = (req.query.role as string) || "";
    const result = await adminService.getUsers(page, limit, search, role);
    sendSuccess(res, result);
  }),

  updateUserStatus: catchAsync(async (req: AuthRequest, res: Response) => {
    const { status } = updateStatusSchema.parse(req.body);
    const user = await adminService.updateUserStatus(req.params.id, status);
    sendSuccess(res, user, `User ${status.toLowerCase()}`);
  }),

  getPendingProposals: catchAsync(async (_req: AuthRequest, res: Response) => {
    const proposals = await adminService.getPendingProposals();
    sendSuccess(res, proposals);
  }),
};
