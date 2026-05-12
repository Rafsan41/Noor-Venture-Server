import winston from "winston";
import { env } from "./env.js";

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  printf(({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`)
);

const prodFormat = combine(timestamp(), json());

const transports: winston.transport[] = [
  new winston.transports.Console(),
];

// File transports only in non-serverless environments (Vercel filesystem is read-only)
if (env.NODE_ENV !== "production") {
  transports.push(new winston.transports.File({ filename: "logs/error.log", level: "error" }));
  transports.push(new winston.transports.File({ filename: "logs/combined.log" }));
}

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "warn" : "debug",
  format: env.NODE_ENV === "production" ? prodFormat : devFormat,
  transports,
});
