import axios from "axios";
import { Router } from "express";
import { errorRes2, successRes2 } from "../model/response.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import logger from "../utils/logger.js";
const callRouter = Router();

callRouter.get(
  "/get-call-count/:caller",
  // authenticateToken,
  async (req, res) => {
    //
    // logger.info("entered");
    const { caller } = req.params;
    const { date, start, end } = req.query;
    try {
      //
      let url = `https://call-sync-backend.vercel.app/get-call-count/${caller}`;

      if (start && end) {
        url += `?start=${start}&end=${end}`;
      } else if (date) {
        url += `?date=${date}`;
      }

      const resp = await axios.get(url, {
        headers: {
          "x-api-key": process.env.API_KEY,
        },
      });
      // logger.info(resp?.data);

      return successRes2(res, 200, "count", resp.data);
    } catch (error) {
      //
      logger.error(error);
      return errorRes2(res, 500, `${error?.message || error}`);
    }
  },
);

callRouter.get(
  "/get-last-sync/:caller",
  // authenticateToken,
  async (req, res) => {
    //
    // logger.info("entered");
    const { caller } = req.params;
    const { date, start, end } = req.query;
    try {
      //
      let url = `https://call-sync-backend.vercel.app/get-last-sync/${caller}`;

      if (start && end) {
        url += `?start=${start}&end=${end}`;
      } else if (date) {
        url += `?date=${date}`;
      }

      const resp = await axios.get(url, {
        headers: {
          "x-api-key": process.env.API_KEY,
        },
      });
      // logger.info(resp?.data);

      return successRes2(res, 200, "count", resp.data);
    } catch (error) {
      //
      logger.error(error);

      return errorRes2(
        res,
        error?.response?.data?.code || 500,
        `${error?.response?.data?.message || error?.message || error}`,
      );
    }
  },
);

export default callRouter;
