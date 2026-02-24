import mongoose from "mongoose";
import config from "./config.js";
import logger from "../utils/logger.js";

const dburl = config.DB_URL;

const connectDatabase = async () => {
  try {
    await mongoose.connect(dburl);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.info("Couldn't connect to MongoDB:", error);
  }
};
export default connectDatabase;
