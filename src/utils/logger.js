import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

import "winston-daily-rotate-file";
import config from "../config/config.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsDir =
  config.STORAGE_ABSOLUTE_PATH ?? path.resolve(__dirname, "../../");

const transport = new winston.transports.DailyRotateFile({
  filename: `${uploadsDir}/logs/app-%DATE%.log`,
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    transport,
    new winston.transports.File({
      filename: `${uploadsDir}/logs/error.log`,
      level: "error",
    }),
    new winston.transports.Console(), // important for docker
  ],
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});
export default logger;
