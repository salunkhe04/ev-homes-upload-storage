import paymentModel from "../model/payment.model.js";
import { errorRes, successRes } from "../model/response.js";
import {
  demandPopulationOptions,
  paymentPopulateOptions,
} from "../utils/constant.js";
import demandModel from "../model/demand.model.js";
import mongoose from "mongoose";
import postSaleLeadModel from "../model/postSaleLead.model.js";
import { de } from "date-fns/locale";

export const getPayment = async (req, res) => {
  try {
    const respPayment = await paymentModel
      .find()
      .populate(paymentPopulateOptions);

    return res.send(
      successRes(200, "Get Payment", {
        data: respPayment,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const getPaymentList = async (req, res) => {
  const { booking } = req.query;
  try {
    const respPayment = await paymentModel.aggregate([
      {
        $match: {
          booking: new mongoose.Types.ObjectId(`${booking}`),
          slab: "project-ev-9-square-vashi-sector-9-6-on-completion-of-3rd-slab-(podium-2)",
        },
      },
      {
        $group: {
          _id: null,
          totalBookingAmount: { $sum: "$bookingAmt" },
          totalGstAmount: { $sum: "$cgst" },
        },
      },
    ]);

    // const respPayment = await paymentModel
    //   .find()
    //   .populate(paymentPopulateOptions);

    return res.send(
      successRes(200, "Get Payment", {
        data: respPayment,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const addPayment = async (req, res) => {
  const body = req.body;

  const {
    projects,
    slab,
    customerName,
    phoneNumber,
    dateOfAmtReceive,
    receiptNo,
    account,
    paymentMode,
    transactionId,
    flatNo,
    amtReceived,
    bookingAmt,
    stampDuty,
    tds,
    cgst,
  } = body;

  // console.log(body);

  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    //   if (!department) return res.send(errorRes(403, "department is required"));
    const newPayment = await paymentModel.create({
      ...body,
    });
    await newPayment.save();
    const respP = await paymentModel
      .findById(newPayment._id)
      .populate(paymentPopulateOptions);

    return res.send(
      successRes(200, `payment added successfully: ${customerName}`, {
        data: respP,
      })
    );
  } catch (error) {
    // console.log(error);
    return res.send(errorRes(500, error));
  }
};

export const addPaymentAtDemand = async (req, res) => {
  const body = req.body;

  const { demand } = body;

  // console.log(body);

  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    //   if (!department) return res.send(errorRes(403, "department is required"));
    let demandResp = await demandModel.findById(demand);

    const newPayment = await paymentModel.create({
      ...body,
      booking: demandResp?.booking,
    });
    try {
      demandResp = await demandModel.findByIdAndUpdate(demand, {
        $addToSet: {
          payments: newPayment?._id,
        },
      });
      try {
        const result = await paymentModel.aggregate([
          {
            $match: {
              projects: demandResp?.project,
              flatNo: demandResp?.flatNo,
              // booking: new mongoose.Types.ObjectId(`${demandResp?.booking}`),
              // slab: demandResp?.slab,
            },
          },
          {
            $group: {
              _id: null,
              totalBookingAmount: { $sum: "$bookingAmt" },
              totalGstAmount: { $sum: "$cgst" },
              totalTdsAmount: { $sum: "$tds" },
            },
          },
        ]);

        // console.log(result);
        if (result.length > 0) {
          const values = result[0];
          const updateAtBooking = await postSaleLeadModel.findByIdAndUpdate(
            demandResp?.booking,
            {
              netAmount: values?.totalBookingAmount,
              cgstAmount: values?.totalGstAmount,
              tdsAmount: values?.totalTdsAmount,
            }
          );
        }
      } catch (error) {
        // console.log(error);
      }
    } catch (error) {
      print(error);
    }
    const respP = await paymentModel
      .findById(newPayment._id)
      .populate(paymentPopulateOptions);

    return res.send(
      successRes(200, `payment added successfully`, {
        data: respP,
      })
    );
  } catch (error) {
    // console.log(error);
    return res.send(errorRes(500, error));
  }
};

export const updatePaymentAtDemand = async (req, res) => {
  const id = req.params.id;
  const body = req.body;

  const { demand } = body;

  // console.log(req.body);

  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    //   if (!department) return res.send(errorRes(403, "department is required"));
    const newPayment = await paymentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...body,
        },
      },
      { upsert: true }
    );
    try {
      const demandResp = await demandModel.findByIdAndUpdate(demand, {
        $addToSet: {
          payments: newPayment?._id,
        },
      });
      try {
        const result = await paymentModel.aggregate([
          {
            $match: {
              projects: demandResp?.project,
              flatNo: demandResp?.flatNo,
              // booking: new mongoose.Types.ObjectId(`${demandResp?.booking}`),
              // slab: demandResp?.slab,
            },
          },
          {
            $group: {
              _id: null,
              totalBookingAmount: { $sum: "$bookingAmt" },
              totalGstAmount: { $sum: "$cgst" },
              totalTdsAmount: { $sum: "$tds" },
            },
          },
        ]);

        // console.log(result);
        if (result.length > 0) {
          const values = result[0];
          const updateAtBooking = await postSaleLeadModel.findByIdAndUpdate(
            demandResp?.booking,
            {
              netAmount: values?.totalBookingAmount,
              cgstAmount: values?.totalGstAmount,
              tdsAmount: values?.totalTdsAmount,
            }
          );
        }
      } catch (error) {
        // console.log(error);
      }
    } catch (error) {
      // console.log(error);
    }

    const respP = await paymentModel
      .findById(newPayment._id)
      .populate(paymentPopulateOptions);

    return res.send(
      successRes(200, `payment added successfully`, {
        data: respP,
      })
    );
  } catch (error) {
    // console.log(error);
    return res.send(errorRes(500, error));
  }
};

export const deletePaymentAtDemand = async (req, res) => {
  const id = req.params.id;
  const { demand } = req.body;

  try {
    if (!id) return res.send(errorRes(403, "Payment ID is required"));
    if (!demand) return res.send(errorRes(403, "Demand ID is required"));

    // Delete the payment first
    const deletedPayment = await paymentModel.findByIdAndDelete(id);
    if (!deletedPayment) return res.send(errorRes(404, "Payment not found"));

    // Remove payment ID from demand payments array
    const finalDemand = await demandModel
      .findByIdAndUpdate(demand, {
        $pull: { payments: id },
      })
      .populate(demandPopulationOptions);

    return res.send(
      successRes(200, "Payment deleted successfully", { data: finalDemand })
    );
  } catch (error) {
    // console.log(error);
    return res.send(errorRes(500, error.message || "Internal Server Error"));
  }
};

export const deletePaymentById = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Payment ID is required"));

    // Delete the payment first
    const foundPayment = await paymentModel.findById(id);
    if (!foundPayment) return res.send(errorRes(404, "Payment not found"));
    const deletedPayment = await paymentModel.deleteOne({ _id: id });

    // console.log(deletedPayment);
    return res.send(
      successRes(200, "Payment deleted successfully", {
        data: deletedPayment.acknowledged,
      })
    );
  } catch (error) {
    // console.log(error);
    return res.send(errorRes(500, error.message || "Internal Server Error"));
  }
};

// export const deletePaymentAtDemand = async (req, res) => {
//   const id = req.params.id;
//   const body = req.body;

//   const { demand } = body;

//   console.log(req.body);

//   try {
//     if (!body) return res.send(errorRes(403, "data is required"));
//     //   if (!department) return res.send(errorRes(403, "department is required"));
//     const newPayment = await paymentModel.findByIdAndUpdate(
//       id,
//       {
//         $set: {
//           ...body,
//         },
//       },
//       { upsert: true }
//     );
//     try {
//       await demandModel.findByIdAndUpdate(demand, {
//         $addToSet: {
//           payments: newPayment?._id,
//         },
//       });
//     } catch (error) {
//       console.log(error);
//     }
//     const respP = await paymentModel
//       .findById(newPayment._id)
//       .populate(paymentPopulateOptions);

//     return res.send(
//       successRes(200, `payment added successfully`, {
//         data: respP,
//       })
//     );
//   } catch (error) {
//     console.log(error);
//     return res.send(errorRes(500, error));
//   }
// };

export const getPaymentbyFlat = async (req, res) => {
  try {
    const flatNo = req.query.flatNo;
    const respPayment = await paymentModel
      .findOne({ flatNo: flatNo })
      .populate(paymentPopulateOptions);

    return res.send(
      successRes(200, "Get Payment", {
        data: respPayment,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

// Update check return and redeposit dates
export const updateCheckDates = async (req, res) => {
  const id = req.params.id;
  try {
    const { paymentId, chequeReturnedDate, chequeRedepositDate } = req.body;
    // console.log(req.body);
    if (!id) {
      return res.send(errorRes(400, "Payment ID is required"));
    }

    const payment = await paymentModel.findById(id);

    if (!payment) {
      return res.send(errorRes(404, "Payment not found"));
    }

    // Update check dates if provided
    if (chequeReturnedDate) {
      // await paymentModel.findByIdAndUpdate(payment._id, {
      //   chequeReturned:new Date(chequeReturnedDate),
      // })
      payment.chequeReturned = new Date(chequeReturnedDate);
    }
    if (chequeRedepositDate) {
      // await paymentModel.findByIdAndUpdate(payment._id, {
      //   chequeRedeposit:new Date(chequeRedepositDate),
      // })

      payment.chequeRedeposit = new Date(chequeRedepositDate);
    }

    await payment.save();

    const updatedPayment = await paymentModel
      .findById(paymentId)
      .populate(paymentPopulateOptions);

    return res.send(
      successRes(200, "Check dates updated successfully", {
        data: updatedPayment,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error.message));
  }
};
// // Update check return and redeposit dates
// export const updateCheckDates = async (req, res) => {
//   const id = req.params.id;
//   try {
//     const { paymentId, checkReturnedDate, checkRedepositDate } = req.body;

//     if (!id) {
//       return res.send(errorRes(400, "Payment ID is required"));
//     }

//     const payment = await paymentModel.findById(id);

//     if (!payment) {
//       return res.send(errorRes(404, "Payment not found"));
//     }

//     // Update check dates if provided
//     if (checkReturnedDate) {
//       payment.checkReturnedDate = new Date(checkReturnedDate);
//     }
//     if (checkRedepositDate) {
//       payment.checkRedepositDate = new Date(checkRedepositDate);
//     }

//     await payment.save();

//     const updatedPayment = await paymentModel
//       .findById(paymentId)
//       .populate(paymentPopulateOptions);

//     return res.send(
//       successRes(200, "Check dates updated successfully", {
//         data: updatedPayment,
//       })
//     );
//   } catch (error) {
//     return res.send(errorRes(500, error.message));
//   }
// };

export const getPaymentsbyFlatNoAndProject = async (req, res) => {
  try {
    const project = req.query.project;
    const flatNo = req.query.flatNo;

    const respPayment = await paymentModel
      .find({
        flatNo: flatNo,
        $or: [{ projects: project }, { project: project }],
      })
      .populate(paymentPopulateOptions);

    return res.send(
      successRes(200, "Get Payment", {
        data: respPayment,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const updatePaymentTypesForSorting = async (req, res) => {
  try {
    //
    const respPayment = await paymentModel.find({});
    const updates = [];

    await Promise.all(
      respPayment.map(async (ele) => {
        let paymentType;
        const bookingAmt = ele.bookingAmt;
        const gstAmt = ele.cgst;
        const tdsAmt = ele.tds;

        if (bookingAmt > 0) {
          paymentType = "booking";
        } else if (gstAmt > 0) {
          paymentType = "gst";
        } else if (tdsAmt > 0) {
          paymentType = "tds";
        }
        await paymentModel.findByIdAndUpdate(ele._id, {
          paymentType: paymentType,
        });
        updates.push({
          paymentType,
          bookingAmt,
          gstAmt,
          tdsAmt,
          flatNo: ele.flatNo,
          project: ele.projects,
          slab: ele.slab,
        });
      })
    );
    res.json(updates);
  } catch (error) {
    //
    res.send(error);
  }
};

export const getPaymentsbyFlatBuildingNoAndProject = async (req, res) => {
  try {
    const project = req.query.project;
    const flatNo = req.query.flatNo;
    const buildingNo = req.query.buildingNo;

    const respPayment = await paymentModel
      .find({
        flatNo: flatNo,
        buildingNo: buildingNo,
        $or: [{ projects: project }, { project: project }],
      })
      .populate(paymentPopulateOptions);

    return res.send(
      successRes(200, "Get Payment", {
        data: respPayment,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};
