import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import {
  addEstimateCompany,
  getEstCompanies,
} from "../../controller/estCompany.controller.js";

const estCompRouter = Router();

estCompRouter.get(
  "/est-companies",
  // authenticateToken,
  getEstCompanies
);
estCompRouter.post(
  "/est-company-add",
  // authenticateToken,
  addEstimateCompany
);

export default estCompRouter;
