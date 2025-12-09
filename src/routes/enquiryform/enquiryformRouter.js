import { Router } from "express";
import {
  addenquiryform,
  getenquiryform,
} from "../../controller/enquiryform.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const enquiryformRouter = Router();
enquiryformRouter.get("/enquiryform", authenticateToken, getenquiryform);

enquiryformRouter.post("/enquiryform-add", authenticateToken, addenquiryform);

export default enquiryformRouter;
