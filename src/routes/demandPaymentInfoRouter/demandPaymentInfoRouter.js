import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import {
  addDemandPaymentInfos,
  getDemandPaymentInfoByBooking,
  getDemandPaymentInfos,
  updateDemandPaymentInfos,
} from "../../controller/demandPaymentInfo.controller.js";

const demandPaymentInfoRouter = Router();
demandPaymentInfoRouter.get(
  "/demand-payment-info",
  authenticateToken,
  getDemandPaymentInfos
);

demandPaymentInfoRouter.post(
  "/demand-payment-info",
  authenticateToken,
  addDemandPaymentInfos
);

demandPaymentInfoRouter.post(
  "/demand-payment-info/:id",
  authenticateToken,
  updateDemandPaymentInfos
);

demandPaymentInfoRouter.get(
  "/demand-payment-info-booking/:booking",
  authenticateToken,
  getDemandPaymentInfoByBooking
);

export default demandPaymentInfoRouter;
