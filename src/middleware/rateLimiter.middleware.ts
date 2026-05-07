import rateLimit from "express-rate-limit";
import { sendError } from "../utils/response";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_, res) => sendError(res, "Too many requests, please try again later.", 429),
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_, res) => sendError(res, "AI request limit reached. Try again in 1 hour.", 429),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_, res) => sendError(res, "Too many login attempts. Try again in 15 minutes.", 429),
});
