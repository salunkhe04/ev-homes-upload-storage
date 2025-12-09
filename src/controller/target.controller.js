import { errorRes, successRes } from "../model/response.js";
import TargetModel from "../model/target.model.js";

export const upsertTarget = async ({
  staffId,
  target,
  achieved,
  month,
  year,
  carryForward,
}) => {
  const extraAchieved = Math.max(0, achieved - target);
  const maxCarryForward = Math.floor(extraAchieved / 2);

  if (carryForward > maxCarryForward) {
    throw new Error(
      "Invalid carry-forward value. It exceeds the maximum possible."
    );
  }

  await TargetModel.updateOne(
    { staffId, month, year },
    {
      $set: {
        target,
        achieved,
        extraAchieved,
        carryForward,
        previousCarryForwardUsed: carryForward > 0,
      },
    },
    { upsert: true }
  );
};

export const getCarryForwardOptions = async (staffId, month, year) => {
  const record = await TargetModel.findOne({ staffId, month, year });
  if (!record) throw new Error("Record not found.");

  const { extraAchieved } = record;
  const maxCarryForward = Math.floor(extraAchieved / 2);

  // Generate dropdown options from 0 to maxCarryForward
  return Array.from({ length: maxCarryForward + 1 }, (_, i) => i);
};

export const getMyTarget = async (req, res, next) => {
  try {
    const id = req.params.id;
    const status = req.query.status;
    const currentDate = new Date();
    let month, year;


    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    if (status) {

      const monthIndex = monthNames.indexOf(status);
      if (monthIndex === -1) {
        return res.send(errorRes(400, "Invalid month name."));
      }
      month = monthIndex + 1; // Months are 1-based in JavaScript
      year = currentDate.getFullYear(); // Use the current year
    } else {
  
      month = currentDate.getMonth() + 1;
      year = currentDate.getFullYear();
    }

  
    let target = await TargetModel.findOne({
      staffId: id,
      month: month,
      year: year,
    });

    if (!target) {
      target = await TargetModel.create({
        staffId: id,
        target: 3, // Default target value
        achieved: 0, // Default achieved value
        carryForward: 0, // Default carryForward value
        month: month,
        year: year,
      });
    }

    return res.send(successRes(200, "Target Fetched", { data: target }));
  } catch (error) {
    if (error.code === 11000) {
      return res.send(
        errorRes(409, "Target already exists for this month and year.")
      );
    }

    return res.send(errorRes(500, "Server Error"));
  }
};

// export const getMyTarget = async (req, res, next) => {
//   try {
//     // const user = req.user;
//     const id = req.params.id;
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth() + 1;
//     const currentYear = currentDate.getFullYear();

//     let target = await TargetModel.findOne({
//       staffId: id,
//       month: currentMonth,
//       year: currentYear,
//     });

//     if (!target) {
//       target = await TargetModel.create({
//         staffId: id,
//         target: 3,
//         achieved: 0,
//         carryForward: 0,
//         month: currentMonth,
//         year: currentYear,
//       });
//     }

//     return res.send(successRes(200, "Target Fetched", { data: target }));
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.send(
//         errorRes(409, "Target already exists for this month and year.")
//       );
//     }

//     return res.send(errorRes(500, "Server Error"));
//     // return next(error);
//   }
// };


export const addNewTarget = async (req, res) => {
  try {
    const user = req.user;
    const { staffId = user?._id, defaultTarget = 3 } = req.body;

    // Get the current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Check if a target already exists for this month and year
    let target = await TargetModel.findOne({
      staffId,
      month: currentMonth,
      year: currentYear,
    });

    if (!target) {
      target = await TargetModel.create({
        staffId,
        target: defaultTarget,
        achieved: 0,
        carryForward: 0,
        month: currentMonth,
        year: currentYear,
      });
    }

    return res.send(successRes(200, "Target Fetched", { data: target }));
  } catch (error) {
    if (error.code === 11000) {
      return res.send(
        errorRes(409, "Target already exists for this month and year.")
      );
    }
    return res.send(errorRes(500, "An error occurred while adding the target"));
  }
};

export const getCarryForwardOption = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) return res.send(errorRes(401, "id required"));

    const date = new Date();
    const resp = await getCarryForwardOptions(
      id,
      date.getMonth() + 1,
      date.getFullYear()
    );

    return res.send(
      successRes(200, "carry forward options", {
        data: resp,
      })
    );
  } catch (error) {
    return res.send(errorRes(200, `${error}`));
  }
};

export const useCarryForward = async (req, res) => {
  try {
    const staffId = req.params.id;
    const user = req.user;
    if (!staffId) return res.send(errorRes(401, "no id provided"));

    const { carryForward } = req.body;
    if (carryForward == 0) {
      return res.send(errorRes(401, "You dont have enough target"));
    }

    // Get the current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Check if a target already exists for this month and year
    let target = await TargetModel.findOne({
      staffId,
      month: currentMonth,
      year: currentYear,
    });

    if (target) {
      target.carryForward = carryForward;
      await target.save();

      target = await TargetModel.create({
        staffId,
        target: 3,
        achieved: carryForward,
        carryForward: 0,
        previousCarryForwardUsed: true,
        month: currentMonth >= 12 ? 1 : currentMonth + 1,
        year: currentMonth >= 12 ? currentYear + 1 : currentYear,
      });
    }

    return res.send(successRes(200, "CarryForward is Used", { data: target }));
  } catch (error) {
    if (error.code === 11000) {
      return res.send(
        errorRes(409, "Target already exists for this month and year.")
      );
    }
    return res.send(errorRes(500, "An error occurred while adding the target"));
  }
};
