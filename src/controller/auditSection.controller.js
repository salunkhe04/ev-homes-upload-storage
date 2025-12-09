import auditSectionModel from "../model/audit_section.model.js";
import { errorRes, successRes } from "../model/response.js";
import { auditSectionPopulateOption } from "../utils/constant.js";

//GET BY ALL
export const getAuditSections = async (req, res) => {
  try {
    const respSections = await auditSectionModel
      .find()
      .populate(auditSectionPopulateOption);

    return res.send(
      successRes(200, "Get Audit Sections", {
        data: respSections,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const addAuditSection = async (req, res) => {
  const { executive, teamLeaders } = req.body;

  try {
    if (!executive) return res.send(errorRes(401, "executive is required"));

    if (!teamLeaders) return res.send(errorRes(401, "teamLeaders is required"));

    const respSection = await auditSectionModel.findOne({
      executive: executive,
    });

    if (respSection) {
      return res.send(errorRes(401, "Audit Section Already Exist"));
    }

    const newDesgId = "audit-" + executive?.replace(/\s+/g, "-").toLowerCase();

    const newSection = await auditSectionModel.create({
      _id: newDesgId,
      executive: executive,
      teamLeaders: teamLeaders,
    });

    const respFound = await auditSectionModel
      .findById(newSection?._id)
      .populate(auditSectionPopulateOption);

    return res.send(
      successRes(200, "New Section added", {
        data: respFound,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const getAuditSectionByExecutive = async (req, res) => {
  const executive = req.params.id;
  try {
    if (!executive) return res.send(errorRes(401, "Id is required"));

    const respSections = await auditSectionModel
      .findOne({ executive: executive })
      .populate(auditSectionPopulateOption);

    if (!respSections) return res.send(errorRes(401, "Record Found"));

    return res.send(
      successRes(200, "Get Audit Sections", {
        data: respSections,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};
