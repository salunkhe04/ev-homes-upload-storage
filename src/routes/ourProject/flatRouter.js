import { Router } from "express";
import ourProjectModel from "../../model/ourProjects.model.js";
import flatModel from "../../model/flat.model.js";
import parkingModel from "../../model/parking.model.js";
import { errorRes2, successRes, successRes2 } from "../../model/response.js";
import { RedisService } from "../../app/redis.js";
import logger from "../../utils/logger.js";
import postSaleLeadModel from "../../model/postSaleLead.model.js";
import leadModelV2 from "../../model/lead/leadV2Model.js";
import moment from "moment-timezone";
const flatRouter = Router();

flatRouter.get("/flat", async (req, res) => {
  const projs = await ourProjectModel.find().lean();
  const flats = [];

  projs.forEach((proj) => {
    proj.flatList.map((flt) => {
      let id = `${proj?._id}-b${flt.buildingNo ?? "0"}-f${flt.floor}-n${
        flt.number
      }-w${flt.wing ?? "-"}`;
      flt._id = id;
      flats.push({
        project: proj?._id,
        ...flt,
      });
    });
  });

  // await flatModel.insertMany(flats);

  res.send({
    message: "Flats inserted successfully",
    count: flats.length,
    data: flats,
  });
});

//get all flats
flatRouter.get("/get-flats", async (req, res) => {
  try {
    const { project } = req.query;

    const cacheData = project ? `flats_${project}` : "flats";

    const cached = await RedisService.get(cacheData, true);
    if (cached) {
      return successRes2(res, 200, "Get Flats-cached", { data: cached });
    }

    let query = { ...(project ? { project: project } : {}) };
    const flats = await flatModel
      .find(query)
      .populate({ path: "project", select: "name" });

    await RedisService.set(cacheData, flats, 86400); // 24 hours

    return successRes2(res, 200, `Flat fetched`, { data: flats });
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, " server error ");
  }
});

//update flat by project id
flatRouter.post("/flat-update/:id", async (req, res) => {
  const id = req.params.id;
  try {
    // logger.info(req.body);

    const flat = await flatModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true },
    );

    const uflat = await flatModel
      .findById(id)
      .populate({ path: "project", select: "name" });

    await RedisService.del("flats");
    await RedisService.del(`flats_${flat.project}`);

    return res.send(
      successRes(200, "flat update", {
        data: uflat,
      }),
    );
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, " server error ");
  }
});

//add flat by project id
flatRouter.post("/add-new-flat/:id", async (req, res) => {
  const id = req.params.id;
  const body = req.body;

  try {
    let { buildingNo, floor, number, wing } = req.body;
    const newFLatId = `${id}-b${buildingNo ?? "0"}-f${floor}-n${number}-w${
      wing ?? "-"
    }"`;
    const existingFlat = await flatModel.findOne({ project: id });

    if (!existingFlat) {
      return errorRes2(res, 404, "Ppoject not found in flats");
    }

    const newFlat = await flatModel.create({
      ...body,
      _id: newFLatId,
    });

    await newFlat.save();

    // logger.info(req.body);

    const uflat = await flatModel
      .findById(newFlat._id)
      .populate({ path: "project", select: "name" });

    await RedisService.del("flats");
    await RedisService.del(`flats_${id}`);

    return res.send(
      successRes(200, "flat update", {
        data: uflat,
      }),
    );
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, " server error ");
  }
});

flatRouter.get("/project-occupied-count/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Find project by name
    const project = await ourProjectModel.findById(id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Count occupied flats
    const notOccupiedCount = project.flatList.filter(
      (flat) => flat.occupied == false,
    ).length;
    const occupiedCount = project.flatList.filter(
      (flat) => flat.occupied == true,
    ).length;

    const occupiedUnits = project.flatList
      .filter((flat) => flat.occupied === true)
      .map((flat) => flat.flatNo);

    const diff = notOccupiedCount + occupiedCount;

    res.json({
      success: true,
      notOccupiedCount: notOccupiedCount,
      occupiedFlats: occupiedCount,
      diff,

      occupiedUnits,

      totalFlats: project.flatList.length,
    });
  } catch (error) {
    logger.info("Error fetching occupied flats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

flatRouter.get("/get-project-info", async (req, res) => {
  //
  try {
    //
    const okss = [];
    const notFound = [];

    const flats = await flatModel.find(
      {
        project: "project-ev-10-marina-bay-vashi-sector-10",
        $or: [
          {
            occupied: true,
          },
          {
            hold: true,
          },
        ],
      },
      {
        number: 1,
        floor: 1,
        flatNo: 1,
        buildingNo: 1,
        occupied: 1,
        hold: 1,
        project: 1,
      },
    );

    await Promise.all(
      flats.map(async (ele) => {
        //
        try {
          //
          let cp = null;

          const booking = await postSaleLeadModel.findOne({
            //
            project: ele.project,
            unitNo: ele.flatNo,
            buildingNo: ele.buildingNo,
            $and: [
              {
                "bookingStatus.type": { $ne: "Cancelled" },
              },
              {
                "bookingStatus.type": { $ne: "cancelled" },
              },
            ],
          });
          if (!booking) {
            okss.push({
              project: ele.project,
              buildingNo: ele.buildingNo,
              floor: ele.floor,
              flatNo: ele.flatNo,

              status: ele.hold === true ? "HOLD" : "OCCUPIED",
              phoneNumber: null,
              name: null,
              bookingStatus: null,
              bookingDate: null,
              leadType: null,
              channelPartner: cp,
              taggingStart: null,
              taggingEnd: null,
              remark: "No booking found",
            });
            return;
          }
          const lead = await leadModelV2.findOne({
            phoneNumber: booking.phoneNumber,
          });

          if (lead) {
            let bookingDate = moment(booking?.date ?? "").tz("Asia/Kolkata");
            let taggingStart = moment(lead?.startDate ?? "").tz("Asia/Kolkata");
            let taggingEnd = moment(lead?.validTill ?? "").tz("Asia/Kolkata");

            if (
              bookingDate.isValid() &&
              taggingStart.isValid() &&
              taggingEnd.isValid()
            ) {
              //
              if (
                bookingDate.isSameOrAfter(taggingStart) &&
                bookingDate.isSameOrBefore(taggingEnd)
              ) {
                //
                cp = lead.channelPartner;
              }
            } else {
              okss.push({
                project: ele.project,
                floor: ele.floor,

                buildingNo: ele.buildingNo,
                flatNo: ele.flatNo,
                status: ele.hold === true ? "HOLD" : "OCCUPIED",
                phoneNumber: booking.phoneNumber,
                name: `${booking.firstName} ${booking.lastName}`,
                bookingStatus: booking.bookingStatus?.type,
                bookingDate: bookingDate?.format("YYYY-MM-DD"),
                leadType: lead?.leadType,
                channelPartner: cp,
                taggingStart: taggingStart?.format("YYYY-MM-DD"),
                taggingEnd: taggingEnd?.format("YYYY-MM-DD"),
                remark: "tagging date issue",
              });
              return;
            }
          }

          okss.push({
            project: ele.project,
            floor: ele.floor,

            buildingNo: ele.buildingNo,
            flatNo: ele.flatNo,
            status: ele.hold === true ? "HOLD" : "OCCUPIED",
            phoneNumber: booking.phoneNumber,
            name: `${booking.firstName} ${booking.lastName}`,
            bookingStatus: booking.bookingStatus.type,
            bookingDate:
              moment(booking?.date ?? "").isValid() &&
              moment(booking?.date ?? "")
                .tz("Asia/Kolkata")
                .format("YYYY-MM-DD"),
            leadType: lead?.leadType,
            channelPartner: cp,
            taggingStart:
              moment(lead?.startDate ?? "").isValid() &&
              moment(lead?.startDate ?? "")
                .tz("Asia/Kolkata")
                .format("YYYY-MM-DD"),
            taggingEnd:
              moment(lead?.validTill ?? "").isValid() &&
              moment(lead?.validTill ?? "")
                .tz("Asia/Kolkata")
                .format("YYYY-MM-DD"),
            remark: "Ok",
          });
        } catch (error) {
          //
          console.log(error);
        }
      }),
    );

    return successRes2(res, 200, "ss", {
      flats: flats.length,
      list: okss.length,
      notFound: notFound.length,
      notFoundList: notFound,
      data: okss,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, `${error}`);
  }
});

export const FlatOccupancyChange = async ({
  project,
  floor,
  buildingNo,
  number,
  occupied,
}) => {
  //
  try {
    //
    const flat = await flatModel.findOne({
      project: project,
      floor: floor,
      buildingNo: buildingNo,
      number: number,
    });

    if (!flat) return null;
    const cacheData = project ? `flats_${project}` : "flats";

    const updated = await flatModel
      .findByIdAndUpdate(flat._id, { occupied: occupied }, { new: true })
      .populate({ path: "project", select: "name" });
    //
    await RedisService.delMultipleKeys(["flats", cacheData]);
    //

    return updated;
  } catch (error) {
    logger.info(error);
    //
    return null;
  }
};
export default flatRouter;
