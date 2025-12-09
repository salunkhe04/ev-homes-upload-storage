import { Router } from "express";
import { redis } from "../../app/redis.js";

const redisRouter = Router();

redisRouter.delete("/cache", async (req, res) => {
  const { key } = req.query; // Example: /cache?key=/data
  if (!key) return res.status(400).json({ error: "Key is required" });

  await redis.del(key);
  res.json({ message: `Cache for '${key}' deleted` });
});

redisRouter.delete("/cache/flush", async (req, res) => {
  await redis.flushall();
  res.json({ message: "All cache cleared!" });
});

export default redisRouter;
