import { Router } from "express";
import {
  addAuditSection,
  getAuditSectionByExecutive,
  getAuditSections,
} from "../../controller/auditSection.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
const auditSectionRouter = Router();

auditSectionRouter.get("/audit-sections", authenticateToken, getAuditSections);
auditSectionRouter.post(
  "/audit-section-add",
  authenticateToken,
  addAuditSection
);
auditSectionRouter.get(
  "/audit-section-by-executive/:id",
  authenticateToken,
  getAuditSectionByExecutive
);

export default auditSectionRouter;
