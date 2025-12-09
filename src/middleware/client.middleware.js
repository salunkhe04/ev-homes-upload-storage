import { errorRes } from "../model/response.js";
// Define the allowed fields for designation updates
const ALLOWED_ClIENT_FIELDS = [
  "id",
  "firstName",
  "lastName",
  "email",
  "phoneNumber",
  "altPhoneNumber",
  "address",
  "password",
  "confirmPassword",
  "choiceOfApt",
  "closingManager",
  "projects",
  "profilePic",
];

// Middleware to validate and filter fields
export const validateClientFields = (req, res, next) => {
  const filteredBody = {};
  let hasValidFields = false;

  for (const field of ALLOWED_ClIENT_FIELDS) {
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

export const validateRegisterClientFields = (body, res) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    altPhoneNumber,
    address,
    password,
  } = body;

  if (!firstName) {
    return res.send(
      errorRes(400, {
        message: "First name is required",
      })
    );
  }

  if (!lastName) {
    return res.send(
      errorRes(400, {
        message: "last name is required",
      })
    );
  }

  if (!phoneNumber) {
    return res.send(
      errorRes(400, {
        message: "phone number is required",
      })
    );
  }

  if (!email) {
    return res.send(
      errorRes(400, {
        message: "email is required",
      })
    );
  }

  // if (!gender) {
  //   return res.send(
  //     errorRes(400, {
  //       message: "gender is required",
  //     })
  //   );
  // }

  if (!address) {
    return res.send(
      errorRes(400, {
        message: "address is required",
      })
    );
  }

  return true;
};
