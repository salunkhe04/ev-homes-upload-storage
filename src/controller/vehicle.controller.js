import vehicleModel from "../model/vehicle.model.js";
import { errorRes, successRes } from "../model/response.js";

export const getVehicle = async (req, res) => {
    try {
      const respClient = await vehicleModel.find();
      return res.send(
        successRes(200, "Get vehicles", {
          data: respClient,
        })
      );
    } catch (error) {
      return res.json({
        message: `error: ${error}`,
      });
    }
  };


  export const addVehicle = async (req, res) => {
    const body = req.body;
    const { vehicleName,vehicleNumber,vehicleNoPhoto,driverFirstName,driverLastName, driverPhoneNo,driverImage,status} = body;
  
    try {
      if (!vehicleName) return res.send(errorRes(403, "Vehicle name is required"));
      if (!vehicleNumber)
        return res.send(errorRes(403, "Vehicle Number is required"));
      
      const newVehicle = await vehicleModel.create({
      ...body,
        
      });
      await newVehicle.save();
  
      return res.send(
        successRes(200, `Event added successfully: ${vehicleName} ${vehicleNumber}`, {
          data: newVehicle,
        })
      );
    } catch (error) {
      return res.send(errorRes(500, error));
    }
  };

