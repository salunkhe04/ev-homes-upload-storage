import { errorRes, successRes } from "../model/response.js";
import whatsnewModel from "../model/whats_new_model.js";

export const getWhatsNew = async (req, res) => {
  try {
    const respWhats = await whatsnewModel.find();

    return res.send(
      successRes(200, "Get what's new section", {
        data: respWhats,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const addWhatsNew = async (req, res) => {
  const body = req.body;
  const { imagesId, showCaseImage, imageName } = body;
  try {
    if (!showCaseImage) return res.send(errorRes(400, "Body is required"));

    const newWhatsNew = await whatsnewModel.create({
     ...body
    });
    await newWhatsNew.save();

    return res.send(
      successRes(200, `Whats new images added successfully`, {
        data: newWhatsNew,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};


export const updateWhatsNew = async (req, res) => {
  const body = req.body;
  const id = req.params.id;

  const {
    imageName,
   showCaseImage
  } = body; // Destructuring the body fields

  try {
    if (!id) return res.send(errorRes(403, "ID is required"));
    if (!showCaseImage) return res.send(errorRes(403, "Image is required"));

    // console.log(body);
    const updatedWhatsNew = await whatsnewModel.findByIdAndUpdate(
      id, // Find by project ID
      { ...body },
      { new: true } // Return the updated document
    );

    if (!updatedWhatsNew)
      return res.send(errorRes(404, `Not Exists: ${id}`));

    // Send a success response
    return res.send(
      successRes(200, `Updated successfully!`, {
        updatedWhatsNew,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const deleteWhatsNew = async (req, res) => {
  const body = req.body;
  const { id } = req.params;
  const { imageName,showCaseImage } = body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    if (!body) return res.send(errorRes(403, "data is required"));

    const deletedWhatsNew = await whatsnewModel.findByIdAndDelete(id);

    if (!deletedWhatsNew)
      return res.send(errorRes(402, `WhatsNew project not deleted: ${imageName}`));

    return res.send(
      successRes(200, `WhatsNew deleted successfully`, {
        deletedWhatsNew,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};







