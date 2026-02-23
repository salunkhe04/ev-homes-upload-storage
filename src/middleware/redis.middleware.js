import { redis } from "../server.js";

export const cacheMiddleware = async (req, res, next) => {
  const key = req.originalUrl; // Use request URL as cache key
  const cachedData = await redis.get(key);

  if (cachedData) {
    return res.json(JSON.parse(cachedData)); // Serve cached data
  }

  res.sendResponse = res.json;
  res.json = (body) => {
    redis.setex(key, 60, JSON.stringify(body)); // Cache for 60 sec
    res.sendResponse(body);
  };

  next();
};
