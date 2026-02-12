import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import incentiveModel from "../../model/incentive/incentive.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../../model/response.js";
import postSaleLeadModel from "../../model/postSaleLead.model.js";
import employeeModel from "../../model/employee.model.js";
import { incentivePopulations } from "../../utils/constant.js";
import moment from "moment-timezone";
import incentiveTransactionModel from "../../model/incentive/incentiveTransaction.model.js";
import { generateTransactionId } from "../../utils/helper.js";
import { getIncetiveByUserId } from "../../controller/incentive.controller.js";

const incentiveRouter = Router();
// console.log(generateTransactionId());

incentiveRouter.get("/incentive", authenticateToken, async (req, res) => {
  try {
    //
  } catch (error) {
    //
  }
});

incentiveRouter.get(
  "/incentive-by-userId/:id",
  authenticateToken,
  getIncetiveByUserId,
);

incentiveRouter.get(
  "/incentive-by-userId-employee",
  authenticateToken,
  async (req, res) => {
    try {
      //
      const foundIncentives = await incentiveModel.find();

      await Promise.all(
        foundIncentives.map(async (ele) => {
          await employeeModel.findByIdAndUpdate(ele.userId, {
            incentive: ele._id,
          });
        }),
      );

      if (!foundIncentives) return errorRes2(res, 404, "No incentive found");

      return successRes2(res, 200, "found incentive", {
        data: foundIncentives,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, "Internal Server error");
    }
  },
);

incentiveRouter.post(
  "/on-booking-incentive/:bookingId",
  authenticateToken,
  async (req, res) => {
    const id = req.params.bookingId;

    try {
      if (!id) return errorRes2(res, 401, "userId is required");

      // find booking
      const foundBooking = await postSaleLeadModel.findById(id);
      // find his team members
      const foundTeamMember = await employeeModel
        .find({
          reportingTo: foundBooking.closingManager,
        })
        .select("_id");
      // find incentives for each
      const ids = [foundBooking.closingManager];
      const foldedIds = foundTeamMember.map((ele) => ele._id);
      ids.push(foldedIds);

      const foundIncentives = await incentiveModel.find({
        userId: { $in: ids },
      });

      if (foundIncentives.length === 0)
        return errorRes2(res, 404, "No Incentive found");

      // add incentive transaction

      const uid = `incentive-${id}`;

      const createdRecord = await incentiveModel.create({
        _id: uid,
        userId: id,
        ...req.body,
      });

      return successRes2(res, 200, "incentive created", {
        data: createdRecord,
      });
    } catch (error) {
      //
      console.log(error);
      return errorRes2(res, 500, "Internal Server error");
    }
  },
);

incentiveRouter.post(
  "/create-incentive-record/:id",
  authenticateToken,
  async (req, res) => {
    const id = req.params.id;

    try {
      if (!id) return errorRes2(res, 401, "userId is required");

      //
      const resp = await incentiveModel.findOne({ userId: id });

      if (resp) return errorRes2(res, 401, "User Already Incentive Exist");

      const uid = `incentive-${id}`;

      const createdRecord = await incentiveModel.create({
        _id: uid,
        userId: id,
        ...req.body,
      });

      return successRes2(res, 200, "incentive created", {
        data: createdRecord,
      });
    } catch (error) {
      //
      console.log(error);
      return errorRes2(res, 500, "Internal Server error");
    }
  },
);

incentiveRouter.get(
  "/get-top-3-incentive",
  // authenticateToken,
  async (req, res) => {
    const ids = [
      "ev15-deepak-karki",
      "ev54-ranjna-gupta",
      "ev70-jaspreet-arora",
    ];

    const startOfMonth = moment().tz("Asia/Kolkata").startOf("month").toDate();
    const endOfMonth = moment().tz("Asia/Kolkata").endOf("month").toDate();

    try {
      const incentives = await incentiveModel
        .find({ userId: { $in: ids } }, { bookings: -1 })
        .populate(incentivePopulations)
        .lean();

      const status = {
        closingManager: { $in: ids },
        "bookingStatus.type": { $ne: "Cancelled" },
        date: { $gte: startOfMonth, $lte: endOfMonth },
      };
      // console.log(status);
      // Step 1: Get all matching bookings
      const bookings = await postSaleLeadModel
        .find({
          closingManager: { $in: ids },
          "bookingStatus.type": { $ne: "Cancelled" },
          date: { $gte: startOfMonth, $lte: endOfMonth },
        })
        .sort({
          date: 1,
        })
        .lean();

      // Step 2: Count bookings per ID
      const countMap = {};
      ids.forEach((id) => (countMap[id] = 0)); // initialize all to 0

      bookings.forEach((booking) => {
        const id = booking.closingManager;
        if (countMap[id] != null) {
          countMap[id]++;
        }
      });

      // Step 3: Sort IDs by count descending
      const sorted = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1]) // sort by count descending
        .slice(0, 3); // take top 3

      // Format result
      const top3 = sorted.map(([id, count]) => ({ id, count }));
      const sortedIncentives = top3
        .map(({ id, count }) => {
          let resp = incentives.find(
            (incentive) => incentive.userId?._id === id,
          );
          if (resp) {
            const { bookings, ...withOutB } = resp;
            return { ...withOutB, count: count };
          }
          return false;
        })
        .filter(Boolean); // remove any nulls if incentive not found

      return successRes2(res, 200, "Top 3 incentives by booking count", {
        data: sortedIncentives,
      });
    } catch (error) {
      console.error(error);
      return errorRes2(res, 500, "Server error");
    }
  },
);

incentiveRouter.post(
  "/create-sales-incentives",
  authenticateToken,
  async (req, res) => {
    try {
      // const resp = await incentiveModel.find();
      // await Promise.all(
      //   resp.map(async (ele) => {
      //     try {
      //       //
      //       console.log(resp.userId);
      //       const bookings = await postSaleLeadModel.find({
      //         closingManager: ele.userId,
      //         "bookingStatus.type": { $ne: "Cancelled" },
      //       });
      //       const bookingIds = bookings.map((ele) => ele?._id);

      //       await incentiveModel.findByIdAndUpdate(ele._id, {
      //         bookings: bookingIds,
      //       });

      //       // ele.bookings = bookingIds ?? [];
      //       // await ele.save();
      //     } catch (error) {
      //       //
      //     }
      //   })
      // );
      const emps = await employeeModel.find({
        _id: {
          $nin: [
            "ev97-dinesh-singh",
            "ev86-akash-gawande",
            "ev79-nishant-dinde",
            "ev105-gurdeep-singh",
            "ev83-pankaj-jena",
            "ev80-santosh-singh",
            "ev98-satish-vanis",
            "ev15-deepak-karki",
            "ev69-vicky-mane",
            "ev70-jaspreet-arora",
            "ev26-harshal-kokate",
          ],
        },
        status: "active",
        department: "dept-marketing",
        designation: {
          $in: [
            "desg-sales-executive",
            "desg-senior-sales-manager",
            "desg-sales-manager",
            "desg-senior-closing-manager",
            "desg-site-head",
          ],
        },
        $or: [
          { division: "div-vashi-sector-9" },
          { division: "div-vashi-sector-10" },
        ],

        // department: "dept-marketing",
        // division: "div-vashi-sector-9",
        // _id: {
        //   $ne: {
        //     $in: [
        //       "ev97-dinesh-singh",
        //       "ev86-akash-gawande",
        //       "ev79-nishant-dinde",
        //       "ev105-gurdeep-singh",
        //       "ev83-pankaj-jena",
        //       "ev80-santosh-singh",
        //       "ev98-satish-vanis",
        //       "ev15-deepak-karki",
        //       "ev69-vicky-mane",
        //       "ev70-jaspreet-arora",
        //       "ev26-harshal-kokate",
        //     ],
        //   },
        // },
        // // designation: { $in: ["desg-senior-closing-manager", "desg-site-head"] },
        // status: "active",
      });

      await Promise.all(
        emps.map(async (ele) => {
          try {
            //

            const uid = `incentive-${ele?._id}`;

            const createdRecord = await incentiveModel.create({
              _id: uid,
              userId: ele?._id,
              scale: "t5-scale",
            });
          } catch (error) {
            //
            console.log(error);
          }
        }),
      );

      //

      return successRes2(res, 200, "incentive created", { data: "ok" });
    } catch (error) {
      //
      console.log(error);
      return errorRes2(res, 500, "Internal Server error");
    }
  },
);
export const addPotential = (booking, userId) => {};

incentiveRouter.post(
  "/add-transaction/:id",
  // authenticateToken,
  async (req, res) => {
    const id = req.params.id;
    const {
      booking,
      earnType,
      transactionType,
      amount,
      date = new Date(),
      remark,
    } = req.body;

    try {
      if (!id) return errorRes2(res, 401, "userId is required");

      //
      const resp = await incentiveModel.findOne({ userId: id });

      if (!resp) return errorRes2(res, 401, "User  Incentive not Exist");
      //
      const foundBooking = await postSaleLeadModel.findById(booking);

      if (!foundBooking) return errorRes2(res, 401, "Booking doesnt exist");
      //
      let tId = "mb/book/DK/25-26/1";

      const transactionId = generateTransactionId();

      const newTransaction = await incentiveTransactionModel.create({
        _id: transactionId,
        bookingId: tId,
        transactionId: transactionId,
        transactionType: transactionType,
        earnType: earnType,
        amount: amount,
        date: date,
        remark: remark,
        userId: id,
        booking: booking,

        //
      });
      return successRes2(res, 200, "incentive created", {
        data: newTransaction,
      });
    } catch (error) {
      //
      console.log(error);
      return errorRes2(res, 500, "Internal Server error");
    }
  },
);
// get transaction by user id
incentiveRouter.get(
  "/incentive-transaction-by-userId/:id",
  // authenticateToken,
  async (req, res) => {
    const id = req.params.id;
    if (!id) return errorRes2(res, 401, "user id requried");

    try {
      //
      const foundIncentives = await incentiveTransactionModel.find({
        userId: id,
      });

      // if (!foundIncentives) return errorRes2(res, 404, "No Transac found");

      return successRes2(res, 200, "found Transactions", {
        data: foundIncentives,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, "Internal Server error");
    }
  },
);

export default incentiveRouter;
