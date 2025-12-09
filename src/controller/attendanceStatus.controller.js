import attendanceStatusModel from "../model/attendance/attendanceStatusType.model.js";
import { errorRes, successRes2 } from "../model/response.js";

//get list
export const getAttendanceStatus = async (req, res) => {
  try {
    const resp = await attendanceStatusModel.find();

    return successRes2(res, 200, "status List", { data: resp });
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

//add new
export const addAttendanceStatus = async (req, res) => {
  const { status } = req.body;
  try {
    if (!status) return res.send(errorRes(401, "status Required"));

    const existingResp = await attendanceStatusModel.findOne({
      status: status,
    });

    if (existingResp) return res.send(errorRes(401, "Status Already Exist"));

    const resp = await attendanceStatusModel.create({
      _id: status?.toLowerCase(),
      status: status?.toLowerCase(),
    });

    return successRes2(res, 200, "status added", { data: resp });
  } catch (error) {
    if (error.code) return res.send(errorRes(500, "Internal Server Error"));
  }
};

//edit
export const editAttendanceStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  try {
    if (!id) return res.send(errorRes(401, "id Required"));
    if (!status) return res.send(errorRes(401, "status Required"));

    const existingResp = await attendanceStatusModel.findById(id);

    if (!existingResp) return res.send(errorRes(404, "Status Not Found"));

    const resp = await attendanceStatusModel.findByIdAndUpdate(
      id,
      {
        status: status?.toLowerCase(),
      },
      { new: true }
    );

    return successRes2(res, 200, "Updated Successfully", { data: resp });
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

//delete
export const deleteAttendanceStatus = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) return res.send(errorRes(401, "id Required"));

    const resp = await attendanceStatusModel.findByIdAndDelete(id);

    return successRes2(res, 200, "Deleted Successfully", { data: resp });
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};
