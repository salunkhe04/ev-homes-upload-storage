import { Router } from "express";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../../model/response.js";
import eoiConfModel from "../../model/eoiAndConfirmation/eoiAndConfirmation.model.js";
import { filterNullValue } from "../../utils/helper.js";
import {
  eoiConfirmationPopulations,
  leadPopulateOptions,
} from "../../utils/constant.js";
import leadModelV2 from "../../model/lead/leadV2Model.js";
import moment from "moment-timezone";
import eoiConfCountModel from "../../model/eoiAndConfirmation/eoi-conf-count.model.js";
import postSaleLeadModel from "../../model/postSaleLead.model.js";

const eoiConfRouter = Router();
// to get unqiue id incremented
const getEoiId = async (type) => {
  //
  const date = moment().tz("Asia/Kolkata").format("DD-MM-YY");
  const foundCount = await eoiConfCountModel.findOne({
    //
    type: type,
  });
  foundCount.count += 1;

  await foundCount.save();

  if (!foundCount) return null;

  let typo = type == "eoi" ? "eoi" : type == "confirmation" ? "conf" : "";
  return `${typo}/${date}/${
    foundCount.count < 100
      ? foundCount.count.toString().padStart(3, "00")
      : foundCount.count
  }`.toUpperCase();
};

eoiConfRouter.get("/eoi-conf-id", async (req, res) => {
  const { type } = req.query;
  const id = await getEoiId(type);
  if (!newId) return errorRes2(res, 404, `no id setup found for ${type}`);

  return successRes2(res, 200, "s", {
    data: newId,
  });
});

eoiConfRouter.get("/eoi-confirmations", async (req, res) => {
  try {
    const { teamLeader, project } = req.query;

    let query = {
      ...(project ? { project } : {}),
    };

    if (teamLeader) {
      const bookings = await postSaleLeadModel
        .find({ closingManager: teamLeader })
        .select("_id");

      const bookingIds = bookings.map((b) => b._id);

      query.booking = { $in: bookingIds };
    }

    const oldDoc = await eoiConfModel
      .find(query)
      .populate(eoiConfirmationPopulations);

    return successRes2(res, 200, "ok", { data: oldDoc });
  } catch (error) {
    console.log(error);
    return errorRes2(res, 500, "Internal Server Error");
  }
});

eoiConfRouter.get("/get-eoi-confirmation", async (req, res) => {
  const { lead, booking } = req.query;
  //
  if (!lead && !booking) return errorRes2(res, 401, "params missing");
  try {
    let statusTofind = { $or: [] };

    if (lead) {
      statusTofind.$or.push({
        lead: lead,
      });
      //
    }

    if (booking) {
      statusTofind.$or.push({
        booking: booking,
      });
      //
    }

    //
    const oldDoc = await eoiConfModel
      .findOne(statusTofind)
      .populate(eoiConfirmationPopulations);

    //
    return successRes2(res, 200, "ok", { data: oldDoc });
  } catch (error) {
    //
    // console.error(error);
    return errorRes2(res, 500, "Internal Server Error");
  }
});

// add/ update
eoiConfRouter.post("/eoi-confirmation", async (req, res) => {
  //
  const {
    id,
    type, //eoi or confirmation
    paymentType, //eoi or confirmation
    document,
    carpetArea,
    areaInSqmtr,
    lead,
    booking,
    project,
    flatNo,
    buildingNo,
    generatedBy,
  } = req.body;
  // console.log(req.body);
  if (!type) return errorRes2(res, 401, "type is required");
  // console.log(req.body);
  const filteredBody = filterNullValue(req.body);
  try {
    const oldDoc = await eoiConfModel.findOne({
      $and: [
        {
          $or: [
            {
              lead: lead,
            },
            {
              booking: booking,
            },
          ],
        },
        // {
        //   $or: [
        //     {
        //       "eoi.generatedBy": generatedBy,
        //     },
        //     {
        //       "eoi.generatedBy": generatedBy,
        //     },
        //   ],
        // },
      ],
    });
    if (oldDoc) {
      let dataToUpdate = { ...filteredBody };

      if (type === "eoi") {
        let oldEoi = oldDoc.eoiList;
        oldEoi.push(oldDoc.eoi);
        dataToUpdate = {
          ...dataToUpdate,
          eoi: {
            //
            generatedBy,
            document,
            date: new Date(),
            paymentType,
            id: id,
          },
          eoiList: oldEoi,
        };
      } else if (type === "confirmation") {
        let oldConf = oldDoc.confirmationList;
        oldConf.push(oldDoc.confirmation);

        dataToUpdate = {
          ...dataToUpdate,
          confirmation: {
            //
            generatedBy,
            document,
            date: new Date(),
            paymentType,
            id: id,
          },
          confirmationList: oldConf,
        };
      }
      const oldDoc2 = await eoiConfModel.findByIdAndUpdate(
        oldDoc._id,
        {
          //
          ...dataToUpdate,
        },
        { new: true },
      );

      return successRes2(res, 200, "ok", { data: oldDoc2 });
    }
    let dataToAdd = {
      //
      ...filteredBody,
    };

    if (type === "eoi") {
      dataToAdd = {
        ...dataToAdd,
        eoi: {
          //
          generatedBy,
          document,
          date: new Date(),
          paymentType,
          id: id,
        },
      };
    } else if (type === "confirmation") {
      dataToAdd = {
        ...dataToAdd,
        confirmation: {
          //
          generatedBy,
          document,
          date: new Date(),
          paymentType,
          id: id,
        },
      };
    }

    const newDoc = await eoiConfModel.create({
      ...dataToAdd,
    });

    //
    return successRes2(res, 200, "ok", { data: newDoc });
  } catch (error) {
    //
    console.log(error);
    return errorRes2(res, 500, "Internal Server Error");
  }
});

// delete
eoiConfRouter.delete("/eoi-confirmation/:id", async (req, res) => {
  //
  if (!req.params.id) return errorRes2(res, 500, "id require");

  try {
    const oldDoc = await eoiConfModel.findById(req.params.id);
    if (!oldDoc) return errorRes2(res, 500, "no Eoi or conf found");

    const deleted = await eoiConfModel.deleteOne({ _id: req.params.id });
    //
    return successRes2(res, 200, "ok", { data: deleted.acknowledged });
  } catch (error) {
    //
    return errorRes2(res, 500, "Internal Server Error");
  }
});

// handover
eoiConfRouter.post("/eoi-confirmation-handover/:id", async (req, res) => {
  //
  const { type, handOver, handOverDate, index, handOverBy } = req.body;
  const id = req.params.id;
  if (!id) return errorRes2(res, 500, "id require");

  try {
    // console.log(req.body);
    const oldDoc = await eoiConfModel.findById(id);
    if (!oldDoc) return errorRes2(res, 500, "no Eoi or conf found");
    if (index) {
      //
      if (type === "eoi") {
        oldDoc.eoiList.forEach((el, i) => {
          //
          if (index === i) {
            //
            el.handOver = handOver;
            el.handOverDate = handOverDate;
            el.handOverBy = handOverBy;
          }
        });
        // console.log(oldDoc.eoiList);
      } else if (type === "confirmation") {
        //
        oldDoc.confirmationList.forEach((el, i) => {
          //
          if (index === i) {
            //
            el.handOver = handOver;
            el.handOverDate = handOverDate;
            el.handOverBy = handOverBy;
          }
        });
      }
      await oldDoc.save();
      //
      const updatedDoc = await eoiConfModel
        .findById(id)
        .populate(eoiConfirmationPopulations);
      //
      return successRes2(res, 200, "ok", {
        data: updatedDoc,
      });
    }

    let dataToUpdate = {};
    if (type === "eoi") {
      //

      dataToUpdate = {
        "eoi.handOver": handOver,
        "eoi.handOverdate": handOverDate,
        "eoi.handOverBy": handOverBy,
      };
    }
    if (type === "confirmation") {
      //
      dataToUpdate = {
        "confirmation.handOver": handOver,
        "confirmation.handOverdate": handOverDate,
        "eoi.handOverBy": handOverBy,
      };
    }

    const updated = await eoiConfModel.findByIdAndUpdate(id, {
      //
      ...dataToUpdate,
      //
    });
    //
    return successRes2(res, 200, "ok", { data: updated });
  } catch (error) {
    //
    return errorRes2(res, 500, "Internal Server Error");
  }
});

eoiConfRouter.get("/eoi-by-phone/:phone", async (req, res) => {
  try {
    const phone = req.params.phone;

    if (!phone) return errorRes2(res, 400, "Phone number is required");

    const leadData = await leadModelV2
      .findOne({ phoneNumber: phone })
      .populate(leadPopulateOptions);

    if (!leadData) {
      return res.send(
        successRes(404, `No lead found for phone number: ${phone}`, {
          data: null,
        }),
      );
    }

    const eoiData = await eoiConfModel
      .findOne({ lead: leadData._id })
      .populate(eoiConfirmationPopulations);

    if (!eoiData) {
      return res.send(
        successRes(404, `No EOI/Confirmation found for this lead`, {}),
      );
    }

    return res.send(
      successRes(200, "EOI/Confirmation found", {
        data: eoiData,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `server error: ${error.message}`));
  }
});

export default eoiConfRouter;
