import { Router } from "express";
import {
  addWhatsNew,
  getWhatsNew,
  updateWhatsNew,
  deleteWhatsNew,
} from "../../controller/whatsnew.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const whatsnewrouterRouter = Router();

whatsnewrouterRouter.get(
  "/whatsnew",
  //  authenticateToken,
  getWhatsNew
);
whatsnewrouterRouter.post("/whats-new-add", authenticateToken, addWhatsNew);
whatsnewrouterRouter.post(
  "/whatsnew-update/:id",
  authenticateToken,
  updateWhatsNew
);
whatsnewrouterRouter.delete(
  "/whatsnew-delete/:id",
  authenticateToken,
  deleteWhatsNew
);

export default whatsnewrouterRouter;
