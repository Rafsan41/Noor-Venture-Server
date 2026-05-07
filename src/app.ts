import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { auth } from "./lib/auth";
import { initSocket } from "./lib/socket";
import { globalLimiter } from "./middleware/rateLimiter.middleware";
import { errorHandler, notFound } from "./middleware/error.middleware";

import proposalRoutes   from "./modules/proposal/proposal.routes";
import investmentRoutes from "./modules/investment/investment.routes";
import walletRoutes     from "./modules/wallet/wallet.routes";
import aiRoutes         from "./modules/ai/ai.routes";
import adminRoutes      from "./modules/admin/admin.routes";
import statsRoutes      from "./modules/stats/stats.routes";
import userRoutes       from "./modules/user/user.routes";
import reportRoutes     from "./modules/report/report.routes";

const app        = express();
const httpServer = http.createServer(app);

// ── Socket.io (real-time) ─────────────────────────────────────────────────────
initSocket(httpServer);

// ── Security & Performance ────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(globalLimiter);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan("dev", { stream: { write: (msg) => logger.http(msg.trim()) } }));

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

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(env.PORT, () => {
  logger.info(`🌙 NoorVenture server running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`⚡ WebSocket ready for real-time updates`);
});

export default app;
