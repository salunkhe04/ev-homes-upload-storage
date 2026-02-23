import clientModel from "../model/client.model.js";
import contestModel from "../model/contest.model.js";
import { errorRes, successRes } from "../model/response.js";
import { encryptPassword } from "../utils/helper.js";

export const getContest = async (req, res) => {
  let query = req.query.query || "";
  let event = req.query.event;
  let statusToFind = {};

  if (event) {
    statusToFind = {
      event,
    };
  }

  const searchConditions = [
    { firstName: { $regex: query, $options: "i" } },
    { lastName: { $regex: query, $options: "i" } },
  ].filter(Boolean);
  let filters = { ...statusToFind, $or: searchConditions };
  try {
    const respDept = await contestModel
      .find(filters)
      .populate({
        select: "",
        path: "event",
      })
      .sort({ createdAt: -1 });

    return res.send(
      successRes(200, "Get Contest Applicants", {
        data: respDept,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const getContestById = async (req, res, next) => {
  const phoneNumber = req.body.phoneNumber;
  const email = req.body.email;
  try {
    // if (!id) return res.send(errorRes(403, "phoneNumber is required"));
    const respContest = await contestModel
      .find({ $or: [{ phoneNumber }, { email }] })
      .populate({
        select: "",
        path: "event",
      });

    if (!respContest) return errorRes(404, "No data found");

    return res.send(
      successRes(200, "Similar Leads", {
        data: respContest,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const addContest = async (req, res) => {
  const body = req.body;

  const {
    firstName,
    lastName,
    phoneNumber,
    email,
    photoUrl,
    thumbnail,
    event,
    createId,
  } = body;


  try {
    if (!firstName) return res.send(errorRes(403, "First name is required"));
    if (!lastName) return res.send(errorRes(403, "Last name is required"));
    if (!phoneNumber)
      return res.send(errorRes(403, "Phone number is required"));

    const newContest = await contestModel.create(body);

    if (createId && email && email != "") {
      const hashPassword = await encryptPassword(
        phoneNumber?.toString() ?? "123456"
      );

      const newClient = new clientModel({
        ...body,
        password: hashPassword,
      });
      await newClient.save();
    }

    const newPopulatedContest = await contestModel
      .findById(newContest.id)
      .populate("event");

    return res.send(
      successRes(
        200,
        `Contest applicant added successfully: ${firstName} ${lastName}`,
        {
          data: newPopulatedContest,
        }
      )
    );
  } catch (error) {
    console.error("Error adding contest:", error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};

export const updateContestById = async (req, res, next) => {
  const id = req.params.id;
  const body = req.body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    if (!body) return res.send(errorRes(403, "body is required"));

    const respContest = await contestModel
      .findByIdAndUpdate(id, {
        ...body,
      })
      .populate({
        select: "",
        path: "event",
      });

    if (!respContest) return errorRes(404, "No data found");

    // if (body.createId && body.email && body.email != "") {
    //   const hashPassword = await encryptPassword(
    //     body.phoneNumber?.toString() ?? "123456"
    //   );

    //   try {
    //     const newClient = new clientModel({
    //       ...body,
    //       password: hashPassword,
    //     });
    //     await newClient.save();
    //   } catch (error) {
    //     // failed to create client
    //   }
    // }

    return res.send(
      successRes(200, "Updated", {
        data: respContest,
      })
    );
  } catch (error) {
    next(error);
  }
};
