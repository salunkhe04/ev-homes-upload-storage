import { Router } from "express";
import rededv10mbModel from "../../model/redev10mb/redev10mb.model.js";
import { successRes2 } from "../../model/response.js";
import { sendMultipleEmail } from "../../utils/brevo.js";
const redev10mbRouter = Router();

redev10mbRouter.post("/add-enquiry-10mb-redev", async (req, res) => {
  //
  const { name, email, phoneNumber, countryCode, ignoreEmail } = req.body;
  try {
    if (!phoneNumber || !name) {
      return errorRes2(res, 401, "name, phoneNumber is required");
    }
    const data = await rededv10mbModel.create({
      //
      ...req.body,
    });
    if (ignoreEmail == true) {
      try {
        await sendMultipleEmail(
          ["ricki@evgroup.co.in"],
          `10 Marina Rehab Lead Received for`,
          `
                Hi,
                A new client has submitted a form. Here are the details:
                
                Client Name: ${name}
                Phone Number: ${phoneNumber}
                Email Address: ${email}
                
                Best regards,
                EV Homes Construction Pvt Ltd`,
        );
      } catch (error) {
        //
      }
    }
    //
    return successRes2(res, 200, "enquiry sent", { data: data });
  } catch (error) {
    //
    return errorRes2(res, 500, `Internal ServerError:  ${error}`);
  }
});

export default redev10mbRouter;
