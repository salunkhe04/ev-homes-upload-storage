import geofenceModel from "../model/geofence.model.js";
import { errorRes, successRes } from "../model/response.js";
import { RedisService } from "../app/redis.js";

//GET BY ALL
export const getGeofence = async (req, res) => {
  try {
    const cached = await RedisService.get("geofences", true);
    if (cached != null) {
      //
      return res.send(
        successRes(200, "Get geofence - cached", {
          data: cached,
        })
      );
    }
    const respGeo = await geofenceModel.find();

    const cacheNew = await RedisService.set("geofences", respGeo, 86400); // 24 hr cache

    return res.send(
      successRes(200, "Get geofence", {
        data: respGeo,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//add division
export const addGeofence = async (req, res) => {
  const body = req.body;

  const { address, name, latitude, longitude, radius, status, locationLink } =
    body;

  try {
    if (!body) return res.send(errorRes(403, "geofence is required"));
    //   const newGeoId = "geo-" + geofence?.replace(/\s+/g, "-").toLowerCase();

    const newGeofence = await geofenceModel.create({
      ...body,
    });
    await newGeofence.save();
    const cached = await RedisService.del("geofences");

    return res.send(
      successRes(200, `geofence added successfully: ${body}`, {
        data: newGeofence,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const updateGeofence = async (req, res) => {
  const body = req.body;
  const id = req.params.id;

  try {
    // Validate the necessary fields
    if (!id) return res.send(errorRes(403, "ID is required"));
    if (!body) return res.send(errorRes(403, "Data is required"));

    const updatedgeofence = await geofenceModel.findByIdAndUpdate(
      id, // Find by project ID
      { ...body },
      { new: true } // Return the updated document
    );

    if (!updatedgeofence)
      return res.send(errorRes(404, `Project not found with ID: ${id}`));

    const cached = await RedisService.del("geofences");

    // Send a success response
    return res.send(
      successRes(200, `Project updated successfully`, {
        data: updatedgeofence,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

//DELETE PROJECTS
export const deleteGeofence = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Geofence ID is required"));
    const deleteGeofence = await geofenceModel.findByIdAndDelete(id);
    if (!deleteGeofence)
      return res.send(errorRes(404, `Project not found with ID: ${id}`));
    const cached = await RedisService.del("geofences");

    return res.send(
      successRes(200, `Project deleted successfully: ${deleteGeofence.name}`, {
        deleteGeofence,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};
