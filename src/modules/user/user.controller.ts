import { Response } from "express";
import { AuthRequest } from "../../types";
import { catchAsync } from "../../utils/catchAsync";
import { sendError, sendSuccess } from "../../utils/response";
import { userService } from "./user.service";
import { updateProfileSchema } from "./user.schema";

export const userController = {
  getMe: catchAsync(async (req: AuthRequest, res: Response) => {
    const user = await userService.getProfile(req.user!.id);
    if (!user) { sendError(res, "User not found", 404); return; }
    sendSuccess(res, user);
  }),

  updateMe: catchAsync(async (req: AuthRequest, res: Response) => {
    const input = updateProfileSchema.parse(req.body);
    const user = await userService.updateProfile(req.user!.id, input);
    sendSuccess(res, user, "Profile updated");
  }),

  getPublicProfile: catchAsync(async (req: AuthRequest, res: Response) => {
    const user = await userService.getPublicProfile(req.params.id);
    if (!user) { sendError(res, "User not found", 404); return; }
    sendSuccess(res, user);
  }),
};
