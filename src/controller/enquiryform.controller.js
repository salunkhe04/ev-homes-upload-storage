import { errorRes, successRes } from "../model/response.js";
import enquiryformModel from "../model/enquiryform.model.js";

export const getenquiryform = async (req, res) => {
  try {
    const respPro = await enquiryformModel.find();
    return res.send(
      successRes(200, "Get enquiry form details", {
        data: respPro,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const addenquiryform = async (req, res) => {
  const body = req.body;

  const { date, clientName, cpphonenumber, enquiryabout, cpemail } = body;

  try {
    if (!date) return res.send(errorRes(403, "date is required"));
    if (!clientName) return res.send(errorRes(403, "name is required"));
    if (!cpphonenumber)
      return res.send(errorRes(403, "phone number is required"));

    const newEnquiry = await enquiryformModel.create({
      ...body,
    });
    await newEnquiry.save();

    return res.send(
      successRes(
        200,
        `Enquiry added successfully: ${clientName} ${cpphonenumber}`,
        {
          data: newEnquiry,
        }
      )
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};
