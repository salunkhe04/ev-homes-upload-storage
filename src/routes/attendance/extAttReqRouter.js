import { Router } from "express";
import extAttReqModel from "../../model/attendance/externalAttendanceRequest.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../../model/response.js";
import { extAttReqPopulateOptions } from "../../utils/constant.js";

const extAttReqRouter = Router();

extAttReqRouter.get("/ext-att-reqs", async (req, res) => {
  //
  const { teamLeader, user } = req.query;
  try {
    //
    const filter = {
      ...(teamLeader ? { teamLeader: teamLeader } : {}),
      ...(user ? { user: user } : {}),
    };
    const resp = await extAttReqModel
      .find(filter)
      .populate(extAttReqPopulateOptions);
    //
    return successRes2(res, 200, "get", {
      data: resp,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, `${error?.message || error}`);
  }
});

extAttReqRouter.post("/ext-att-request", async (req, res) => {
  //
  const body = req.body;
  try {
    //

    if (!body) return errorRes2(res, "body is required");

    // console.log(body);
    const newAtt = await extAttReqModel.create({
      ...body,
    });
    await newAtt.save();

    return successRes2(res, 200, `req added successfully: ${body}`, {
      data: newAtt,
    });
    //
  } catch (error) {
    //
    return errorRes2(res, 500, `${error?.message || error}`);
  }
});

extAttReqRouter.get("/ext-att-req/:id", async (req, res) => {
  //
  const id = req.params.id;

  try {
    //

    if (!id) return errorRes2(res, "id is required");

    const resp = await extAttReqModel
      .findById(id)
      .populate(extAttReqPopulateOptions);

    return successRes2(res, 200, `req fetched successfully`, {
      data: resp,
    });
    //
  } catch (error) {
    //
    return errorRes2(res, 500, `${error?.message || error}`);
  }
});

extAttReqRouter.post("/ext-att-req-status/:id", async (req, res) => {
  //
  const id = req.params.id;
  const body = req.body;
  const { latitude, longitude, attachment, status } = body;

  try {
    //

    if (!id) return errorRes2(res, 401, "id is required");
    if (!body) return errorRes2(res, 401, "body is required");

    const resp = await extAttReqModel.findByIdAndUpdate(
      id,
      { ...body, status: "approved" },
      { new: true },
    );

    const att = await extAttReqModel
      .findById(id)
      .populate(extAttReqPopulateOptions);

    return successRes2(res, 200, `req fetched successfully`, {
      data: att,
    });
    //
  } catch (error) {
    //
    return errorRes2(res, 500, `${error?.message || error}`);
  }
});

extAttReqRouter.delete("/delete-ext-att-req/:id", async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "ID is required"));
    const deleteWeekoff = await extAttReqModel
      .findByIdAndDelete(id)
      .populate(extAttReqPopulateOptions);
    if (!deleteWeekoff)
      return res.send(errorRes(404, `Request not found with ID: ${id}`));
    return res.send(
      successRes(200, `Request deleted successfully`, {
        data: deleteWeekoff,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
});
export default extAttReqRouter;
