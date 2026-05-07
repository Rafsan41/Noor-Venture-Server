import { Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { sendError } from "../utils/response";
import { AuthRequest, Role } from "../types";

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      sendError(res, "Unauthorized — please log in", 401);
      return;
    }

    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user as any).role ?? "INVESTOR",
      status: (session.user as any).status ?? "ACTIVE",
      nidVerified: (session.user as any).nidVerified ?? false,
      image: session.user.image,
    };

    if (req.user.status === "BANNED" || req.user.status === "SUSPENDED") {
      sendError(res, "Your account has been suspended. Contact support.", 403);
      return;
    }

    next();
  } catch {
    sendError(res, "Authentication failed", 401);
  }
};

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, "Forbidden — insufficient permissions", 403);
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole("ADMIN");
export const requireOwner = requireRole("BUSINESS_OWNER", "ADMIN");
export const requireInvestor = requireRole("INVESTOR", "ADMIN");
