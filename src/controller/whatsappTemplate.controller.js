import whatsappTemplateModel from "../model/whatsappTemplate.model.js";
import { errorRes, successRes } from "../model/response.js";
import ourProjectModel from "../model/ourProjects.model.js";
import logger from "../utils/logger.js";

export const getWhatsAppTemplate = async (req, res, next) => {
  try {
    const resp = await whatsappTemplateModel
      .find()
      .populate({ path: "projects", select: "name" });

    return res.send(
      successRes(200, "Whatsapp Templates Fetched Successfully!", {
        data: resp,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const addWhatsAppTemplate = async (req, res, next) => {
  const body = req.body;

  try {
    if (!body) return res.send(errorRes(400, "body is required"));

    const newResp = await whatsappTemplateModel.create({ ...body });

    await newResp.save();

    return res.send(
      successRes(200, "Template Added successfully", { data: newResp }),
    );
  } catch (e) {
    // logger.info(e);
    return res.send(errorRes(500, "Server Error"));
  }
};

// export const getWhatsAppTemplateByProject = async (req, res, next) => {
//   const id = req.params.id;
//   try {
//     if (!id) return res.send(errorRes(404, "Id is required"));

//     const project = await ourProjectModel.findById(id);
//     if (!project) return res.send(errorRes(401, "Project not found"));

//     const templates = await whatsappTemplateModel
//       .find({ projects: id })
//       .populate({ path: "projects", select: "name" });
//     logger.info(templates.length);

//     return res.send(
//       successRes(200, "Whatsapp template by project", { data: templates })
//     );
//   } catch (e) {
// logger.info(e);
//     return res.send(errorRes(500, `Server Error ${e}`));
//   }
// };

export const getWhatsAppTemplateByProject = async (req, res, next) => {
  const id = req.params.id;
  const { templateName } = req.query; // <-- get from query string

  try {
    if (!id) return res.send(errorRes(404, "Id is required"));

    const project = await ourProjectModel.findById(id);
    if (!project) return res.send(errorRes(401, "Project not found"));

    let query = { projects: id };

    // logger.info(query);
    if (templateName && templateName !== "/") {
      const cleanedName = templateName.replace(/^\/+/, "");
      query = {
        ...query,
        templateName: { $regex: `^${cleanedName}`, $options: "i" },
      };
      // logger.info("Query:", query);
      // logger.info("Cleaned name:", cleanedName);
    }

    const templates = await whatsappTemplateModel
      .find(query)
      .populate({ path: "projects", select: "name" });

    if (templates.length === 0) {
      return res.send(
        successRes(200, "No matching templates found", { data: [] }),
      );
    }

    // logger.info(templates);

    return res.send(
      successRes(200, "Whatsapp template by project", { data: templates }),
    );
  } catch (e) {
    logger.info(e);
    return res.send(errorRes(500, `Server Error ${e}`));
  }
};

export const deleteWhatsAppTemplate = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Asset ID is required"));
    const deleteTemplate = await whatsappTemplateModel.findByIdAndDelete(id);
    if (!deleteTemplate) return res.send(errorRes(404, `Id not found`));
    return res.send(
      successRes(200, `Whatsapp Template Deleted Successfully!`, {
        deleteTemplate,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};
