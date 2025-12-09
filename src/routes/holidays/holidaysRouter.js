import { Router } from "express";
import {
  getHoliday,
  addHoliday,
  updateHoliday,
  deleteHoliday,
} from "../../controller/holidays.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const holidayRouter = Router();
holidayRouter.get("/holiday", authenticateToken, getHoliday);
holidayRouter.post("/holiday-add", authenticateToken, addHoliday);
holidayRouter.post("/holiday-update/:id", authenticateToken, updateHoliday);
holidayRouter.delete("/holiday/:id", authenticateToken, deleteHoliday);

export default holidayRouter;
