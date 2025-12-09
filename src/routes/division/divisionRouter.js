import { Router } from "express";
import {
  getDivision,
  getDivisionById,
  addDivision,
  updateDivision,
  deleteDivision,
} from "../../controller/division.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const divRouter = Router();
divRouter.get("/division", getDivision);
divRouter.get("/division/:id", authenticateToken, getDivisionById);
divRouter.post("/division-add", authenticateToken, addDivision);
divRouter.post("/division-update/:id", authenticateToken, updateDivision);

divRouter.delete("/division/:id", authenticateToken, deleteDivision);

export default divRouter;
