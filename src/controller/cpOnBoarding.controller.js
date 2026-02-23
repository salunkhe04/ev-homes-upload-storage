import cpModel from "../model/channelPartner.model.js";
import CpOnBoardingModel from "../model/cp_onboarding.model.js";
import onboardTargetModel from "../model/onboard/onboardTargetModel.js";
import { errorRes, successRes } from "../model/response.js";
import {
  cponboardPopulate,
  cponboardTargetPopulate,
} from "../utils/constant.js";
import { encryptPassword } from "../utils/helper.js";
import moment from "moment-timezone";

export const getOnBoardedCp = async (req, res) => {
  try {
    const resp = await CpOnBoardingModel.find()
      .select("-password")
      .populate(cponboardPopulate);

    if (!resp) return res.send(errorRes(500, "No response found!"));
    return res.send(successRes(200, "List Retrieved!", { data: resp }));
  } catch (e) {
    return res.send(errorRes(500, `Server Error ${e}`));
  }
};

export const getOnBoardedCpById = async (req, res) => {
  const id = req.params.id;
  try {
    const resp = await CpOnBoardingModel.findById(id)
      .select("-password")
      .populate(cponboardPopulate);

    if (!resp) return res.send(errorRes(500, "No response found!"));
    return res.send(successRes(200, "List Retrieved!", { data: resp }));
  } catch (e) {
    return res.send(errorRes(500, `Server Error ${e}`));
  }
};

export const onboardCp = async (req, res) => {
  try {
    const body = req.body;
    const { firmName, email, phoneNumber, firstName, lastName } = body;
    const existingCp = await cpModel
      .findOne({
        $or: [
          {
            email: email,
          },
          { phoneNumber: phoneNumber },
        ],
      })
      .lean();
    if (existingCp) {
      return res.send(errorRes(401, "Already exists!"));
    }

    const defaultPassword = "Evhomecp";

    const hashedPassword = await encryptPassword(defaultPassword);

    //cp model id
    const cpId =
      firmName?.replace(/\s+/g, "-").toLowerCase() +
      "-" +
      firstName?.replace(/\s+/g, "").toLowerCase() +
      "-" +
      lastName.replace(/\s+/g, "").toLowerCase();

    //on board id
    // const firm ="on-board-"+ firmName?.replace(/\s+/g, "-").toLowerCase() ;
    // const customId = `on-board-${firm}`;

    const onboarding = await CpOnBoardingModel.create({
      ...body,
      _id: cpId,
      password: hashedPassword,
    });

    const cpadded = await cpModel.create({
      ...body,
      _id: cpId,
      password: hashedPassword,
    });

    onboarding.channelPartner = cpadded?._id;
    await onboarding.save();

    const updated = await CpOnBoardingModel.findById(onboarding._id).populate(
      cponboardPopulate
    );

    return res.send(
      successRes(200, "Channel Partner onboarded successfully", {
        data: updated,
      })
    );
  } catch (error) {
    console.error("Onboarding Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMonthlyTarget = async (req, res) => {
  const { date } = req.query;
  let fDate = new Date();
  if (date != null) {
    fDate = new Date(date);
  }
  try {
    const foundTarget = await onboardTargetModel
      .findOne({
        month: fDate.getMonth() + 1,
        year: fDate.getFullYear(),
      })
      .populate(cponboardTargetPopulate);

    if (foundTarget) {
      return res.send(
        successRes(200, "target retrieved!", {
          data: foundTarget,
        })
      );
    }

    const nowStartOfMonth = moment(date)
      .tz("Asia/Kolkata")
      .startOf("month")
      .toDate();

    const nowEndOfMonth = moment(date)
      .tz("Asia/Kolkata")
      .endOf("month")
      .toDate();

    const filter = {
      date: { $gte: nowStartOfMonth, $lte: nowEndOfMonth },
    };
    const resp = await CpOnBoardingModel.find(filter, { _id: 1 });

    // const resp = await CpOnBoardingModel.countDocuments(filter);
    const onboards = resp.map((ele) => ele?._id);

    const createTarget = await onboardTargetModel.create({
      target: 5,
      achieved: resp.length,
      pending: 5 - resp.length,
      onboards: onboards,
    });

    const updatedTarget = await onboardTargetModel
      .findById(createTarget?._id)
      .populate(cponboardTargetPopulate);

    return res.send(
      successRes(200, "target retrieved!", {
        data: updatedTarget,
      })
    );
  } catch (e) {
    return res.send(errorRes(500, `Server Error ${e}`));
  }
};
