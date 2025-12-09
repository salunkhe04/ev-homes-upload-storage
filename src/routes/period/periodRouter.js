// period.routes.js
import { Router } from "express";
import periodModel from "../../model/period/period.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import { ensurePeriodsUpToCurrentWeek } from "./periodService.js";

const periodRouter = Router();

// GET all periods or by type
periodRouter.get("/periods", async (req, res) => {
  try {
    const { type } = req.query; // ?type=sample_period
    const filter = type ? { period: type } : {};
    const periods = await periodModel.find(filter).sort({ startDate: -1 });
    return successRes2(res, 200, "Periods", { data: periods });
  } catch (err) {
    return errorRes2(res, 500, `${err?.message}`);
  }
});

// GET current period for today (or given date) & type
periodRouter.get("/current-period", async (req, res) => {
  try {
    const { type, date } = req.query; // ?type=sample_period&date=2025-08-13
    // if (!type) return errorRes2(res, 400, "type is required");

    // If date not provided, use today's date
    const targetDate = date ? new Date(date) : new Date();
    let filter = {
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    };
    if (type) {
      filter.period = type;
    }
    const current = await periodModel.findOne(filter);

    if (!current) {
      return errorRes2(res, 404, "No period found for the given date");
    }
    return successRes2(res, 200, "current periods", { data: current });
  } catch (err) {
    return errorRes2(res, 500, `${err?.message}`);
  }
});

// CREATE a period (Monday–Sunday auto-set via schema middleware)
periodRouter.post("/create-period", async (req, res) => {
  try {
    const { period } = req.body;
    if (!period) return errorRes2(res, 400, "period is required");
    const newPeriod = await periodModel.create({ period });
    return successRes2(res, 201, "Periods", { data: newPeriod });
  } catch (err) {
    if (err.code === 11000) {
      return errorRes2(res, 400, "Period already exists for this week");
    }
    return errorRes2(res, 500, `${err?.message}`);
  }
});

// DELETE by ID
periodRouter.delete("/delete-period/:id", async (req, res) => {
  try {
    const deleted = await periodModel.findByIdAndDelete(req.params.id);
    if (!deleted) return errorRes2(res, 400, "Period not found");
    return successRes2(res, 200, "Deleted successfully");
  } catch (err) {
    return errorRes2(res, 500, `${err?.message}`);
  }
});

periodRouter.post("/auto-create-chain", async (req, res) => {
  try {
    const result = await ensurePeriodsUpToCurrentWeek(); // default tz Asia/Kolkata
    return successRes2(res, 200, "auto-create result", { data: result });
  } catch (err) {
    return errorRes2(res, 500, err.message || String(err));
  }
});

export default periodRouter;
