import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { env } from "../config/env";
import { logger } from "../config/logger";

let io: SocketServer;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL, "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join proposal room to get live updates for a specific proposal
    socket.on("join:proposal", (proposalId: string) => {
      socket.join(`proposal:${proposalId}`);
    });

    socket.on("leave:proposal", (proposalId: string) => {
      socket.leave(`proposal:${proposalId}`);
    });

    // Join dashboard room for live stats
    socket.on("join:dashboard", () => {
      socket.join("dashboard");
    });

    // Join admin room
    socket.on("join:admin", () => {
      socket.join("admin");
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

// ── Event emitters ────────────────────────────────────────────────────────────

export const socketEvents = {
  // When a new investment is made
  newInvestment(data: {
    proposalId: string;
    proposalTitle: string;
    investorName: string;
    amount: number;
    newAmountRaised: number;
    fundingGoal: number;
    progressPercent: number;
  }) {
    const socket = getIO();
    // Notify everyone watching this proposal
    socket.to(`proposal:${data.proposalId}`).emit("investment:new", data);
    // Notify dashboard watchers
    socket.to("dashboard").emit("investment:new", data);
    // Notify admin
    socket.to("admin").emit("investment:new", data);
  },

  // When a proposal gets fully funded
  proposalFunded(data: {
    proposalId: string;
    title: string;
    totalRaised: number;
    totalInvestors: number;
  }) {
    const socket = getIO();
    socket.emit("proposal:funded", data); // broadcast to everyone
  },

  // Live platform stats update
  statsUpdate(data: {
    totalRaised: number;
    totalInvestors: number;
    activeProposals: number;
    totalProposals: number;
  }) {
    const socket = getIO();
    socket.to("dashboard").emit("stats:update", data);
  },

  // When profit is distributed to investors
  profitDistributed(data: {
    proposalId: string;
    proposalTitle: string;
    totalDistributed: number;
    month: string;
  }) {
    const socket = getIO();
    socket.to(`proposal:${data.proposalId}`).emit("profit:distributed", data);
    socket.to("dashboard").emit("profit:distributed", data);
  },

  // When admin approves/rejects a proposal
  proposalStatusChanged(data: {
    proposalId: string;
    title: string;
    status: string;
  }) {
    const socket = getIO();
    socket.to(`proposal:${data.proposalId}`).emit("proposal:status", data);
    socket.to("admin").emit("proposal:status", data);
  },
};
