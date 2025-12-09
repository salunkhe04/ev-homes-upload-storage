import employeeModel from "../model/employee.model.js";
import { errorRes, successRes } from "../model/response.js";
import teamSectionModel from "../model/teamSections.model.js";
import {
  employeePopulateOptions,
  teamSectionPopulateOptions,
} from "../utils/constant.js";

//GET BY ALL
export const getTeamSections = async (req, res) => {
  try {
    const respSections = await teamSectionModel
      .find()
      .populate("designations")
      .sort({ createdAt: 1 });
    return res.send(
      successRes(200, "Get team Sections", {
        data: respSections,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const addTeamSection = async (req, res) => {
  const { section, designations, sectionType } = req.body;
  try {
    if (!section) return res.send(errorRes(401, "Section is required"));

    if (!designations)
      return res.send(errorRes(401, "Desginations List is required"));

    const respSection = await teamSectionModel.find({
      section: section,
    });

    if (respSection.length > 0)
      return res.send(errorRes(401, "Team Section Already Exist"));

    const newDesgId = section?.replace(/\s+/g, "-") + "team".toLowerCase();

    const newSection = await teamSectionModel.create({
      _id: newDesgId,
      section: section,
      sectionType,
      designations: designations,
    });
    const respFound = await teamSectionModel
      .findById(newSection?._id)
      .populate("designations");

    return res.send(
      successRes(200, "New Section added", {
        data: respFound,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const getTeamSectionById = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "id Required"));
    const respSections = await teamSectionModel
      .findById(id)
      .populate(teamSectionPopulateOptions);
    let members = [];
    if (respSections?.sectionType === "members") {
      const desgIds = respSections.designations.map((dg) => dg._id);

      const findEmployees = await employeeModel
        .find({
          designation: { $in: desgIds },
        })
        .populate([
          {
            path: "designation",
          },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: {
              path: "designation",
            },
          },
        ])
        .select("firstName lastName designation reportingTo")
        .lean();

      // console.log(findEmployees);
      members = findEmployees;
      // respSections.members = findEmployees;
    }

    // if (respSections)
    return res.send(
      successRes(200, "Get team Sections", {
        data: { ...respSections._doc, members },
      })
    );
  } catch (error) {
    // console.log(error);
    return res.send(errorRes(500, error));
  }
};
