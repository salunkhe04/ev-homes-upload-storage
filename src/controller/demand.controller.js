import demandModel from "../model/demand.model.js";
import postSaleLeadModel from "../model/postSaleLead.model.js";
import { errorRes, successRes } from "../model/response.js";
import { demandPopulationOptions } from "../utils/constant.js";
import logger from "../utils/logger.js";

export const getDemand = async (req, res) => {
  try {
    const respDemand = await demandModel
      .find()
      .populate(demandPopulationOptions);
    // .populate({
    //   path: "reminders.customer",
    // });

    return res.send(
      successRes(200, "Get Demand Details", {
        data: respDemand,
      }),
    );
  } catch (error) {
    logger.error(error);

    return res.send(errorRes(500, error));
  }
};

export const getDemandBybooking = async (req, res) => {
  const booking = req.params.booking;
  try {
    // logger.info(booking);
    const respDemand = await demandModel
      .findOne({ booking: booking })
      .populate(demandPopulationOptions)
      .sort({ date: -1 });

    if (!respDemand) return res.send(errorRes(404, "no Demand Found"));

    return res.send(
      successRes(200, "Get Demand Details", {
        data: respDemand,
      }),
    );
  } catch (error) {
    logger.error(error);

    return res.send(errorRes(500, error));
  }
};
export const getDemandBybookings = async (req, res) => {
  const booking = req.params.booking;
  try {
    // logger.info(booking);

    const foundBooking = await postSaleLeadModel.findById(booking);

    const respDemand = await demandModel
      .find({
        $or: [
          { booking: booking },
          { flatNo: foundBooking?.unitNo, project: foundBooking.project },
        ],
      })
      .populate(demandPopulationOptions)
      .sort({ date: -1 });

    if (!respDemand) return res.send(errorRes(404, "no Demand Found"));

    return res.send(
      successRes(200, "Get Demand Details", {
        data: respDemand,
      }),
    );
  } catch (error) {
    logger.error(error);

    return res.send(errorRes(500, error));
  }
};

export const getDemandCountByProjectAndSlab = async (req, res) => {
  try {
    let project = req.query.project;
    let slab = req.query.slab;

    if (!project) {
      return res.send(errorRes(400, "Project is required"));
    }
    if (!slab) {
      return res.send(errorRes(400, "Slab is required"));
    }

    const totalItemCount = await demandModel.countDocuments({
      project: project,
    });
    // Query the database to count demands for the specified project and slab
    const demandCount = await demandModel.countDocuments({
      project: project,
      slab: slab,
    });

    const resp = await demandModel
      .find({
        project: project,
        slab: slab,
      })
      .populate(demandPopulationOptions);

    return res.send(
      successRes(200, "Demand count for project and slab", {
        // project: project,
        // slab: slab,
        data: {
          totalItemCount: totalItemCount,
          demandGeneratedcount: demandCount,
          resp,
        },
      }),
    );
  } catch (error) {
    logger.error(error);

    return res.send(errorRes(500, error.message));
  }
};

export const getDemandInfo = async (req, res) => {
  try {
    let project = req.query.project;
    let slab = req.query.slab;

    if (!project) {
      return res.send(errorRes(400, "Project is required"));
    }
    if (!slab) {
      return res.send(errorRes(400, "Slab is required"));
    }

    const resp = await demandModel
      .find({
        project: project,
        slab: slab,
      })
      .populate(demandPopulationOptions);

    // logger.info(resp);
    return res.send(
      successRes(200, "Demand for project and slab", {
        data: resp,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, error.message));
  }
};

export const addDemand = async (req, res) => {
  const { project, booking, flatNo, slab } = req.body;
  try {
    if (!req.body) return res.send(errorRes(401, "data Required"));
    // logger.info(req.body);
    //find exisiting demand
    let exisitingDemand = await demandModel.findOne({
      project,
      flatNo,
      slab,
    });
    //update in exisiting demand if already exist
    if (exisitingDemand) {
      const updateData = { ...req.body };
      delete updateData._id; // Ensure _id is not included in the update

      exisitingDemand = await demandModel
        .findByIdAndUpdate(
          exisitingDemand._id,
          { $set: updateData },
          { new: true },
        )
        .populate(demandPopulationOptions);

      return res.send(
        successRes(200, "demand Updated", {
          data: exisitingDemand,
        }),
      );
    }
    // create new demand
    const respDemand = await demandModel.create({ ...req.body });

    //get populated demand
    const updatedNewDemand = await demandModel
      .findById(respDemand._id)
      .populate(demandPopulationOptions);

    return res.send(
      successRes(200, "new Demand Added", {
        data: updatedNewDemand,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error));
  }
};

export const updateDemandHandover = async (req, res) => {
  const id = req.params.id;

  try {
    const now = new Date();
    const updatedDemand = await demandModel
      .findByIdAndUpdate(
        id,
        { isHandedOver: true, handoverDate: now },
        { new: true },
      )
      .populate(demandPopulationOptions);

    if (!updatedDemand) {
      return res.send(errorRes(404, "Demand not found"));
    }

    return res.send(
      successRes(200, "Demand handover updated", {
        data: updatedDemand,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error.message));
  }
};

export const deleteDemandById = async (req, res) => {
  const id = req.params.id;

  try {
    const updatedDemand = await demandModel.findByIdAndDelete(id);

    return res.send(
      successRes(200, "Demand deleted successfully", {
        data: updatedDemand,
      }),
    );
  } catch (error) {
    logger.error(error);

    return res.send(errorRes(500, error.message));
  }
};
