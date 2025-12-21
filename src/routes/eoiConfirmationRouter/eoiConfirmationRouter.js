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

const eoiConfRouter = Router();

eoiConfRouter.get("/eoi-confirmations", async (req, res) => {
  //
  try {
    //
    console.log("p");
    const oldDoc = await eoiConfModel
      .find()
      .populate(eoiConfirmationPopulations);

    //
    return successRes2(res, 200, "ok", { data: oldDoc });
  } catch (error) {
    //
    return errorRes2(res, 500, "Internal Server Error");
  }
});
// add/ update
eoiConfRouter.post("/eoi-confirmation", async (req, res) => {
  //
  const {
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
        dataToUpdate = {
          ...dataToUpdate,
          eoi: {
            //
            generatedBy,
            document,
            date: new Date(),
          },
        };
      } else if (type === "confirmation") {
        dataToUpdate = {
          ...dataToUpdate,
          confirmation: {
            //
            generatedBy,
            document,
            date: new Date(),
          },
        };
      }
      const oldDoc2 = await eoiConfModel.findByIdAndUpdate(
        oldDoc._id,
        {
          //
          ...dataToUpdate,
        },
        { new: true }
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
  const { type, handOver, handOverDate } = req.body;
  const id = req.params.id;
  if (!id) return errorRes2(res, 500, "id require");

  try {
    const oldDoc = await eoiConfModel.findById(id);
    if (!oldDoc) return errorRes2(res, 500, "no Eoi or conf found");

    let dataToUpdate = {};
    if (type === "eoi") {
      //
      dataToUpdate = {
        "eoi.handOver": handOver,
        "eoi.handOverdate": handOverDate,
      };
    }
    if (type === "confirmation") {
      //
      dataToUpdate = {
        "confirmation.handOver": handOver,
        "confirmation.handOverdate": handOverDate,
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
        })
      );
    }

    const eoiData = await eoiConfModel
      .findOne({ lead: leadData._id })
      .populate(eoiConfirmationPopulations);

    if (!eoiData) {
      return res.send(
        successRes(404, `No EOI/Confirmation found for this lead`, {})
      );
    }

    return res.send(
      successRes(200, "EOI/Confirmation found", {
        data: eoiData,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `server error: ${error.message}`));
  }
});

export default eoiConfRouter;
