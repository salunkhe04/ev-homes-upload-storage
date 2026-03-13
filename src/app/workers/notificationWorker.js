import { Queue } from "bullmq";
import { redis } from "../redis.js";
export let notificationQueue;
notificationQueue = new Queue("notifications", { connection: redis });
