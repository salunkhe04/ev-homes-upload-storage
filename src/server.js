import { app } from "./app/app.js";
import {
  logRequest,
  versionCheckMiddleware,
} from "./middleware/auth.middleware.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import router from "./routes/router.js";
import connectDatabase from "./config/database.js";
import { io } from "./socket/socket.js";
import { initCronJobs } from "./app/cron.js";
import { hostnameCheck } from "./utils/helper.js";
import routerV2 from "./v2Router/routerV2.js";
import rateLimit from "express-rate-limit";
import { redis } from "./app/redis.js";
import RedisStore from "rate-limit-redis";

router.get("/health", (req, res) => {
  return res.status(200).send("OK");
});

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 200 requests per minute
  standardHeaders: "draft-8",
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),

  // Skip example (admin bypass)
  // skip: (req) => req.user?.role === "admin",
});

// Apply the rate limiting middleware to all requests.
app.use(limiter)
app.use(hostnameCheck);
app.use(logRequest);
// app.use(versionCheckMiddleware);
app.use("/", router);
app.use("/v2", routerV2);

app.use(notFound);
app.use(errorHandler);

connectDatabase();
initCronJobs();
