import express from "express";
import cors from "cors";
import http from "http";
import "dotenv/config";
import config from "../config/config.js";
import cookieParser from "cookie-parser";
import logger from "../utils/logger.js";

export const app = express();
export const server = http.createServer(app);

// base middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "2gb" }));
app.use(express.urlencoded({ limit: "2gb", extended: true }));

app.use(async (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    if (durationMs > 1000) {
      // log only if >1s
      logger.info(
        `${new Date().toISOString()} - Slow route: ${req.method} ${req.url} took ${durationMs.toFixed(2)}ms`,
      );
    }
  });
  next();
});

if (config.ENVIRONMENT == "1") {
  server.listen(config.PORT, () =>
    logger.info("listening on port " + config.PORT),
  );
} else {
  server.listen(config.PORT, "127.0.0.1", () =>
    logger.info("listening on port " + config.PORT),
  );
}

// app.listen(8082, "127.0.0.1");
