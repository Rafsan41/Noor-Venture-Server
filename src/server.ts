import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./lib/prisma.js";
import { initSocket } from "./lib/socket.js";

// Only start the server locally (not on Vercel)
if (!process.env.VERCEL) {
  async function main() {
    try {
      await prisma.$connect();
      logger.info("Database connected");

      const httpServer = http.createServer(app);
      initSocket(httpServer);

      httpServer.listen(env.PORT, () => {
        logger.info(`🌙 NoorVenture server running on port ${env.PORT} [${env.NODE_ENV}]`);
        logger.info(`⚡ WebSocket ready for real-time updates`);
      });
    } catch (error) {
      logger.error("Failed to start server", error);
      await prisma.$disconnect();
      process.exit(1);
    }
  }
  main();
}

// Export for Vercel serverless deployment
export default app;
