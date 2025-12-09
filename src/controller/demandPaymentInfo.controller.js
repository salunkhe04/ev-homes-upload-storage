import demandPaymentInfoModel from "../model/demandPaymentInfo.model.js";
import { errorRes, successRes, successRes2 } from "../model/response.js";

export const getDemandPaymentInfos = async (req, res, next) => {
  try {
    const resp = await demandPaymentInfoModel.find();

    return successRes2(res, 200, "list", {
      data: resp,
    });
  } catch (error) {
    return errorRes(500, `${error}`);
  }
};

export const addDemandPaymentInfos = async (req, res, next) => {
  const body = req.body;
  try {
    const resp = await demandPaymentInfoModel.create({ ...body });

    return successRes2(res, 200, "list", {
      data: resp,
    });
  } catch (error) {
    return errorRes(500, `${error}`);
  }
};

export const updateDemandPaymentInfos = async (req, res, next) => {
  const id = req.params.id;
  const body = req.body;
  try {
    const resp = await demandPaymentInfoModel.findByIdAndUpdate(id, {
      ...body,
    });

    return successRes2(res, 200, "updated Successfully", {
      data: resp,
    });
  } catch (error) {
    return errorRes(500, `${error}`);
  }
};

export const getDemandPaymentInfoByBooking = async (req, res, next) => {
  const id = req.params.booking;
  try {
    const resp = await demandPaymentInfoModel.find({ booking: id });

    return successRes2(res, 200, "list", {
      data: resp,
    });
  } catch (error) {
    return errorRes(500, `${error}`);
  }
};
