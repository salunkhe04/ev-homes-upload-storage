import couponModel from "../model/coupon.model.js";
import { errorRes, successRes } from "../model/response.js";

export const getCoupon = async (req, res) => {
  try {
    const currentDate = new Date();
    const respClient = await couponModel.find();

    return res.send(
      successRes(200, "Get Coupon", {
        data: respClient,
      })
    );
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};

export const addCoupon = async (req, res) => {
  const body = req.body;

  const { codeName, codeValue, disPercentage, startDate, validTill } = body;

  // console.log("Received Data:", body);

  try {
    if (!codeName) return res.send(errorRes(403, "Code name is required"));
    //  if(!codeValue || !disPercentage)return res.send(errorRes(403, 'Atleast one is required'));
    //  console.log(   disPercentage);
    const newCoupon = await couponModel.create(body);

    return res.send(
      successRes(200, `Coupon added successfully: ${codeName} `, {
        data: newCoupon,
      })
    );
  } catch (error) {
    console.error("Error adding contest:", error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};
