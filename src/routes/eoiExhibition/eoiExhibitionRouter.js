import { Router } from "express";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../../model/response.js";
import eoiExhibitionModel from "../../model/eoiExhibition/eoiExhibition.model.js";
import { eoiExhibitionPopulations } from "../../utils/constant.js";
import clientModel from "../../model/client.model.js";
import { encryptPassword } from "../../utils/helper.js";
const eoiExhibitionRouter = Router();

eoiExhibitionRouter.get("/eoi-exhibition", async (req, res) => {
  //
  try {
    //
    // console.log("p");
    const oldDoc = await eoiExhibitionModel
      .find()
      .populate(eoiExhibitionPopulations)
      .sort({ createdAt: -1 });

    //
    return successRes2(res, 200, "ok", { data: oldDoc });
  } catch (error) {
    //
    return errorRes2(res, 500, "Internal Server Error");
  }
});

eoiExhibitionRouter.post("/add-eoi-exhibition", async (req, res) => {
  const body = req.body;
  const {
    closingManager,
    project,
    unitNo,
    floor,
    buildingNo,
    number,
    eoiAmount,
    countryCode,

    firstNameApp1,
    lastNameApp1,
    addressApp1,
    cityApp1,
    pincodeApp1,
    phoneNumber,

    emailApp1,
    phoneNumberApp2,
  } = body;

  try {
    // Basic required field validation
    if (!project) {
      return errorRes2(res, 401, "Project not found!");
    }
    if (!body) return res.send(errorRes(403, "data is required"));

    const newEOI = await eoiExhibitionModel.create({
      ...body,
    });

    await newEOI.save();
    console.log(phoneNumber);

    try {
      const existingClient = await clientModel.findOne({
        phoneNumber: phoneNumber,
      });

      if (!existingClient) {
        const hashPassword = await encryptPassword(phoneNumber?.toString());

        const newClient = await clientModel.create({
          firstName: firstNameApp1,
          lastName: lastNameApp1,
          email: emailApp1,
          phoneNumber: phoneNumber,
          projects: project,
          address: addressApp1,
          closingManager,
          password: hashPassword,
        });

        await newClient.save();
      }
    } catch (e) {
      console.error("EOI Error:", e);
    }

    const respP = await eoiExhibitionModel
      .findById(newEOI._id)
      .populate(eoiExhibitionPopulations);

    return successRes2(res, 200, "Entry added successfully", { data: respP });
  } catch (error) {
    console.error("EOI Error:", error);
    return errorRes2(res, 500, "Internal Server Error");
  }
});

eoiExhibitionRouter.delete("/eoi-exhibition/:id", async (req, res) => {
  //
  if (!req.params.id) return errorRes2(res, 500, "id require");

  try {
    const oldDoc = await eoiExhibitionModel.findById(req.params.id);
    if (!oldDoc) return errorRes2(res, 500, "no Eoi found");

    const deleted = await eoiExhibitionModel.deleteOne({ _id: req.params.id });
    //
    return successRes2(res, 200, "ok", { data: deleted.acknowledged });
  } catch (error) {
    //
    return errorRes2(res, 500, "Internal Server Error");
  }
});

export default eoiExhibitionRouter;
