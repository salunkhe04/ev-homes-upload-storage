import { errorRes } from "../model/res.js";

// Define the allowed fields for designation updates
const ALLOWED_PROJECTS_FIELDS = [
  "id",
  "amenities",
  "bhklist",
  "contactnumber",
  "countrycode",
  "description",
  "locationlink",
  "locationname",
  "name",
  "brochure",
  "showcaseimage"
];

// Middleware to validate and filter fields
export const validateDivisionFields = (req, res, next) => {
  const filteredBody = {};
  let hasValidFields = false;

  for (const field of ALLOWED_PROJECTS_FIELDS) {
    if (field in req.body && req.body[field] != null) {
      filteredBody[field] = req.body[field];
      hasValidFields = true;
    }
  }

  if (!hasValidFields) {
    return res.send(
      errorRes(400, {
        message: "No valid fields to update",
      })
    );
  }

  // Attach the filtered body to the request object
  req.filteredBody = filteredBody;
  next();
};
