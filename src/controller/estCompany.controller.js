import estCompanyModel from "../model/estimateCompany.model.js";
import { errorRes, successRes } from "../model/response.js";

export const getEstCompanies = async (req, res, next) => {
  try {
    const resp = await estCompanyModel.find();

    return res.send(
      successRes(200, "estimate company list", {
        data: resp,
      })
    );
  } catch (error) {
    next(error);
  }
};

//ADD Requirement
export const addEstimateCompany = async (req, res) => {
  const body = req.body;
  const { name } = body;
  try {
    // if (!body) return res.send(errorRes(403, "data is required"));
    if (!name) return res.send(errorRes(403, "requirement is required"));

    const newCompany = await estCompanyModel.create({
      name: name,
    });

    return res.send(
      successRes(200, `company added successfully: ${name}`, {
        data: newCompany.name,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};
