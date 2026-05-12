import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";

import { env }           from "./config/env.js";
import { logger }        from "./config/logger.js";
import { auth }          from "./lib/auth.js";
import { globalLimiter } from "./middleware/rateLimiter.middleware.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

import proposalRoutes   from "./modules/proposal/proposal.routes.js";
import investmentRoutes from "./modules/investment/investment.routes.js";
import walletRoutes     from "./modules/wallet/wallet.routes.js";
import aiRoutes         from "./modules/ai/ai.routes.js";
import adminRoutes      from "./modules/admin/admin.routes.js";
import statsRoutes      from "./modules/stats/stats.routes.js";
import userRoutes       from "./modules/user/user.routes.js";
import reportRoutes     from "./modules/report/report.routes.js";

// ── Express App Setup ─────────────────────────────────────────────────────────
const app = express();

// ── Security & Performance ────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(globalLimiter);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan("dev", { stream: { write: (msg: string) => logger.http(msg.trim()) } }));

// ── Better Auth ───────────────────────────────────────────────────────────────
app.all("/api/auth/*", toNodeHandler(auth));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: env.NODE_ENV });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/proposals",   proposalRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/wallet",      walletRoutes);
app.use("/api/ai",          aiRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/stats",       statsRoutes);
app.use("/api/users",       userRoutes);
app.use("/api/reports",     reportRoutes);

// ── 404 + Error handlers ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
