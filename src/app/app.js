import express from "express";
import cors from "cors";
import http from "http";
import "dotenv/config";
import config from "../config/config.js";
import cookieParser from "cookie-parser";

export const app = express();
export const server = http.createServer(app);

// base middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "2gb" }));
app.use(express.urlencoded({ limit: "2gb", extended: true }));

if (config.ENVIRONMENT == "1") {
  server.listen(config.PORT, () =>
    console.log("listening on port " + config.PORT)
  );
} else {
  server.listen(config.PORT, "127.0.0.1", () =>
    console.log("listening on port " + config.PORT)
  );
}

// app.listen(8082, "127.0.0.1");
