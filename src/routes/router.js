import { Router } from "express";
import storageRouter from "./storage/storageRouter.js";
import { readFile } from "fs/promises";
import axios from "axios";
import path from "path";
import { errorRes2, successRes, successRes2 } from "../model/response.js";
import moment from "moment-timezone";
import logger from "../utils/logger.js";
const router = Router();

router.get("/ping", async (req, res) => {
  res.json({ code: 200, message: "ok" });
});

router.get("/status", async (req, res) => {
  logger.info(`${new Date().toString()}`);
  res.json({
    code: 200,
    message: "ok",
    date: new Date(),
    dateStr: new Date().toString(),
  });
});


router.get("/", async (req, res) => {
  const htmlContent = await readFile(
    "./src/templates/api_welcome_page.html",
    "utf8",
  );
  return res.type("html").send(htmlContent);
});



router.use(storageRouter);
export default router;
