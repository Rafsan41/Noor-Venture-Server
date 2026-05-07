import { Request } from "express";

export type Role = "ADMIN" | "BUSINESS_OWNER" | "INVESTOR";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";
export type ProposalStatus =
  | "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"
  | "FUNDED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type InvestmentStatus = "ACTIVE" | "COMPLETED" | "WITHDRAWN";
export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "INVESTMENT" | "PROFIT" | "REFUND";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  nidVerified: boolean;
  image?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ProposalQuery extends PaginationQuery {
  search?: string;
  category?: string;
  status?: ProposalStatus;
  riskLevel?: RiskLevel;
  minGoal?: string;
  maxGoal?: string;
  sort?: "newest" | "oldest" | "goal_asc" | "goal_desc" | "raised_desc";
}
