// Vercel serverless entry point
// Wraps app initialisation so startup errors surface in the HTTP response (not as opaque 500s)
import type { Request, Response } from "express";

let handler: any;
let startupError: unknown = null;

try {
  handler = (await import("./app.js")).default;
} catch (err) {
  startupError = err;
  // Create a minimal fallback that returns the real error
  const { default: express } = await import("express");
  const fallback = express();
  fallback.use((_req: Request, res: Response) => {
    res.status(500).json({
      error: "Server failed to initialise",
      message: String(startupError),
      stack: process.env.NODE_ENV !== "production"
        ? (startupError as any)?.stack
        : undefined,
    });
  });
  handler = fallback;
}

export default handler;
