import { Router } from "express";
import { addCoupon, getCoupon } from "../../controller/coupon.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const couponRouter = Router();
couponRouter.get("/coupons",getCoupon);

couponRouter.post("/coupon-add", authenticateToken, addCoupon);
export default couponRouter;
