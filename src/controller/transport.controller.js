import oneSignalModel from "../model/oneSignal.model.js";
import { errorRes, successRes } from "../model/response.js";
import TransportModel from "../model/transport.model.js";
import vehicleModel from "../model/vehicle.model.js";
import { tansportPopulateOptions } from "../utils/constant.js";
import { sendNotificationWithInfo } from "./oneSignal.controller.js";

export const getTransports = async (req, res) => {
  const status = req.query.status;
  let statusToFind = {};
  if (status?.toLowerCase() == "ontheway") {
    statusToFind = {
      stage: "ontheway",
    };
  } else if (status?.toLowerCase() == "completed") {
    statusToFind = {
      stage: "completed",
    };
  } else if (status?.toLowerCase() == "approval-pending") {
    statusToFind = {
      $or: [
        { stage: "approval" },
        { approvalStatus: "pending" },
        { stage: null },
        { approvalStatus: null },
      ],
    };
  } else if (status?.toLowerCase() == "approved") {
    statusToFind = {
      stage: "approved",
    };
  } else if (status?.toLowerCase() == "rejected") {
    statusToFind = {
      stage: "rejected",
    };
  } else if (status?.toLowerCase() == "rejected") {
    statusToFind = {
      approvalStatus: "rejected",
    };
  }
  try {
    const resp = await TransportModel.find(statusToFind)
      .populate(tansportPopulateOptions)
      .sort({ createdAt: -1 });

    return res.send(successRes(200, "Get Transports", { data: resp }));
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
};

export const getTransportById = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, `id is required`));

    const resp = await TransportModel.findById(id).populate(
      tansportPopulateOptions
    );

    return res.send(successRes(200, "Get Transports", { data: resp }));
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
};

export const addTransport = async (req, res) => {
  const {
    startDate,
    destination,
    numberOfPassengers,
    clientName,
    clientEmail,
    clientPhone,
    manager,
    smanagerList,
    vehicle,
  } = req.body;
  try {
    // logger.info(req.body);
    // if (!id) return res.send(errorRes(401, "id is required"));
    // if (!message) return res.send(errorRes(401, "message is required"));
    // if (!type) return res.send(errorRes(401, "type is required"));

    const resp = await TransportModel.create({
      ...req.body,
      startDate: new Date(startDate),
      pickupLocation: "679105383f865aa5d732512b",
    });
    // await vehicleModel.findByIdAndUpdate(vehicle, { status: true });
    const resp2 = await TransportModel.findById(resp._id).populate(
      tansportPopulateOptions
    );
    const allwoed = [
      "ev15-deepak-karki",
      "ev89-narayan-jha",
      "ev88-pavan-ale",
      "ev0001-ricki-thomas",
      "ev201-aktarul-biswas",
    ];

    const foundTLPlayerId = await oneSignalModel.find({
      docId: { $in: allwoed },
      // role: "employee",
    });

    if (foundTLPlayerId.length > 0) {
      // logger.info(foundTLPlayerId);
      const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

      await sendNotificationWithInfo({
        playerIds: getPlayerIds,
        title: "Transport request recieved by!",
        message: `request by ${manager}`,
        data: {
          type: "transport",
          id: resp._id,
          role: "approval",
        },
      });
    }

    return res.send(successRes(200, "Added Transport", { data: resp2 }));
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
};

export const approveTransport = async (req, res) => {
  const { status } = req.body;
  const id = req.params.id;
  const user = req?.user;
  try {
    // logger.info(req.body);
    // if (!id) return res.send(errorRes(401, "id is required"));

    // await vehicleModel.findByIdAndUpdate(vehicle, { status: true });
    const resp2 = await TransportModel.findByIdAndUpdate(id, {
      stage: status.toLowerCase() === "approved" ? "approved" : "rejected",
      approvalStatus: status,
      approvalBy: user?._id,
    }).populate(tansportPopulateOptions);

    if (status.toLowerCase() === "approved") {
      await vehicleModel.findByIdAndUpdate(resp2.vehicle._id, { status: true });
    }
    const foundTLPlayerId = await oneSignalModel.find({
      docId: { $in: [resp2?.manager?._id, "ev201-aktarul-biswas"] },
      // role: "employee",
    });

    if (foundTLPlayerId.length > 0) {
      // logger.info(foundTLPlayerId);
      const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

      await sendNotificationWithInfo({
        playerIds: getPlayerIds,
        title: `Transport request ${status}`,
        message: `request by ${resp2?.manager?._id}`,
        data: {
          type: "transport",
          id: resp2?._id,
        },
      });
    }

    return res.send(successRes(200, "Added Transport", { data: resp2 }));
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
};

export const completedTransport = async (req, res) => {
  const id = req.params.id;
  try {
    // if (!id) return res.send(errorRes(401, "id is required"));

    // await vehicleModel.findByIdAndUpdate(vehicle, { status: true });
    const resp2 = await TransportModel.findByIdAndUpdate(id, {
      stage: "completed",
      jurneyStatus: "completed",
    }).populate(tansportPopulateOptions);

    await vehicleModel.findByIdAndUpdate(resp2.vehicle._id, { status: false });

    return res.send(successRes(200, "Added Transport", { data: resp2 }));
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
};

export const startJourney = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "Transport ID is required"));

    const transport = await TransportModel.findByIdAndUpdate(id, {
      stage: "ontheway",
      jurneyStatus: "ontheway",
    }).populate(tansportPopulateOptions);

    if (!transport) return res.send(errorRes(404, "Transport not found"));
    await vehicleModel.findByIdAndUpdate(transport.vehicle._id, {
      status: true,
    });

    return res.send(
      successRes(200, "Journey started successfully", {
        data: transport,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
};
