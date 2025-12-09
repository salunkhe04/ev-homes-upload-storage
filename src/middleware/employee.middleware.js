import { errorRes } from "../model/response.js";
// Define the allowed fields for designation updates
const ALLOWED_EMPLOYEE_FIELDS = [
  "id",
  "email",
  "prefix",
  "employeeId",
  "password",
  "confirmPassword",
  "firstName",
  "middleName",
  "lastName",
  "gender",
  "dateOfBirth",
  "address",
  "department",
  "designation",
  "bloodGroup",
  "maritalStatus",
  "division",
  "status",
  "reportingTo",
  "countryCode",
  "phoneNumber",
  "isVerified",
  "profilePic",
  "joiningDate",
  "shift",
  "experienceStatus",
  "personalDocument",
];

// Middleware to validate and filter fields
export const validateEmployeeFields = (req, res, next) => {
  const filteredBody = {};
  let hasValidFields = false;

  for (const field of ALLOWED_EMPLOYEE_FIELDS) {
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

export const validateRegisterEmployeeFields = (body) => {
  const requiredFields = [
    "email",
    "employeeId",
    "password",
    "confirmPassword",
    "firstName",
    "lastName",
    "gender",
    "dateOfBirth",
    "address",
    "department",
    "designation",
    "division",
    "phoneNumber",
  ];
  // console.log(body);

  for (let field of requiredFields) {
    if (!body[field]) {
      return { isValid: false, message: `${field} is required` };
    }
  }

  if (body.password && body.password.length < 6) {
    return {
      isValid: false,
      message: "Password should be at least 6 character long",
    };
  }

  if (body.confirmPassword && body.confirmPassword.length < 6) {
    return {
      isValid: false,
      message: "Password should be at least 6 character long",
    };
  }

  if (body.password !== body.confirmPassword) {
    return {
      isValid: false,
      message: "Password and confirm password didn't matched",
    };
  }

  if (body.phoneNumber && body.phoneNumber.length < 10) {
    return { isValid: false, message: "Phone Number should be 10 Digit" };
  }

  return { isValid: true };
};
