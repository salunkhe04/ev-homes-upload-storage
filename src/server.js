import { app } from "./app/app.js";

import { errorHandler, notFound } from "./middleware/errorHandler.js";
import router from "./routes/router.js";
import connectDatabase from "./config/database.js";
// import rateLimit from "express-rate-limit";
import { redis } from "./app/redis.js";
import RedisStore from "rate-limit-redis";

router.get("/health", (req, res) => {
  res.send(`Handled by port ${process.env.PORT}`);
});

// const limiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 500, // 200 requests per minute
//   standardHeaders: "draft-8",
//   legacyHeaders: false,

//   store: new RedisStore({
//     sendCommand: (...args) => redis.call(...args),
//   }),

//   // Skip example (admin bypass)
//   // skip: (req) => req.user?.role === "admin",
// });

// Apply the rate limiting middleware to all requests.
app.set("trust proxy", 1);
app.use("/", router);
app.use(notFound);
app.use(errorHandler);

connectDatabase();
// initCronJobs();
