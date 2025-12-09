import { errorRes } from "../model/response.js";
// Define the allowed fields for designation updates
const ALLOWED_LEAD_FIELDS = [
  "id",
  "email",
  "firstName",
  "lastName",
  "phoneNumber",
  "altPhoneNumber",
  "remark",
  "project",
  "requirement",
  "startDate",
  "validTill",
  "address",
  "channelPartner",
  "dataAnalyser",
  "teamLeader",
  "preSalesExecutive",
  "previousValidTill",
  "countryCode",
  "status",
  "interestedStatus",
  "approvalStatus",
  "visitStatus",
  "visitRef",
  "revisitStatus",
  "revisitRef",
  "bookingStatus",
  "bookingRef",
  "clientStatus",
  "clientRef",
  "leadType",
  "clientInterestedStatus",
  "propertyType",
];

// Middleware to validate and filter fields
export const validateLeadsFields = (req, res, next) => {
  const filteredBody = {};
  let hasValidFields = false;

  for (const field of ALLOWED_LEAD_FIELDS) {
    if (field in req.body && req.body[field] != null) {
      filteredBody[field] = req.body[field];
      hasValidFields = true;
    }
  }

  if (!hasValidFields) {
    return res.send(errorRes(400, "No valid fields to found"));
  }
  req.filteredBody = filteredBody;
  next();
};

export const validateRequiredLeadsFields = (body) => {
  const requiredFields = [
    // "email",
    // "firstName",
    // "lastName",
    "phoneNumber",
    // "address",
    // "project",
    // "requirement",
  ];
  for (let field of requiredFields) {
    if (!body[field]) {
      return { isValid: false, message: `${field} is required` };
    }
  }
  return { isValid: true };
};
