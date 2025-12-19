import Redis from "ioredis";
import config from "../config/config.js";
export let isRedisConnected = false;
export const redis = undefined;
// new Redis({
//   host: "host.docker.internal",
//   // host: "srv615709.hstgr.cloud",
//   port: 6379,
//   password: config.REDIS_KEY,
//   connectTimeout: 10000,
//   retryStrategy: (times) => Math.min(times * 50, 2000),
//   maxRetriesPerRequest: null,
// });

redis.on("connect", () => {
  isRedisConnected = true;
  console.log("Connected to Redis!");
});
redis.on("error", (err) => console.error("Redis Error:", err));

export const RedisService = {
  /**
   * Set a value with optional expiration (in seconds)
   */
  async set(key, value, expiryInSeconds = null) {
    const data = typeof value === "object" ? JSON.stringify(value) : value;
    if (expiryInSeconds) {
      await redis.set(key, data, "EX", expiryInSeconds);
    } else {
      await redis.set(key, data);
    }
  },

  /**
   * Set a values []using multiple keys with optional expiration (in seconds)
   */
  async setMultipleKeys(keys = [], value, expiryInSeconds = null) {
    const data = typeof value === "object" ? JSON.stringify(value) : value;
    const pipeline = redis.pipeline();

    keys.forEach((key) => {
      if (expiryInSeconds) {
        pipeline.set(key, data, "EX", expiryInSeconds);
      } else {
        pipeline.set(key, data);
      }
    });

    await pipeline.exec();
  },

  /**
   * Get a value and optionally parse JSON
   */
  async get(key, parseJson = true) {
    const value = await redis.get(key);
    if (!value) return null;

    try {
      return parseJson ? JSON.parse(value) : value;
    } catch (e) {
      return value; // fallback if it's not JSON
    }
  },

  /**
   * Delete a key
   */
  async del(key) {
    return await redis.del(key);
  },
  /**
   * Delete multiple a key
   */

  async delMultipleKeys(keys = []) {
    if (keys.length === 0) return 0;
    return await redis.del(...keys);
  },

  /**
   * Disconnect Redis cleanly
   */
  disconnect() {
    redis.disconnect();
  },
};
