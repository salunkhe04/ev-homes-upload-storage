import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import moment from "moment-timezone";
import logger from "./logger.js";

export const getVerificationToken = () => {
  var token = crypto.randomBytes(32).toString("hex");
  return token;
};
export const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  return hashPassword;
};

export const comparePassword = async (plainPass, hashPass) => {
  const verifyPassword = await bcrypt.compare(plainPass, hashPass);
  return verifyPassword;
};

export const createJwtToken = (data, secretKey, validity) => {
  const options = {};

  if (validity) {
    options.expiresIn = validity;
  }

  const token = jwt.sign({ data }, secretKey, options);
  return token;
};
// export const createJwtToken = (data, secretKey, validity) => {
//   if (validity) {
//     const token = jwt.sign({ data, exp: validity }, secretKey);
//     return token;
//   }
//   const token = jwt.sign({ data }, secretKey);
//   return token;
// };

export const verifyJwtToken = (token, secretKey) => {
  return jwt.verify(token, secretKey);
};

export const validateToken = () => {
  try {
    const decoded = jwt.verify(token, secret);
    return { valid: true, decoded };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return { valid: false, expired: true };
    }
    return { valid: false, expired: false };
  }
};

export function generateOTP(length) {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

export const hostnameCheck = (req, res, next) => {
  let requestHost = req.get("Host");

  if (requestHost.includes(":")) {
    requestHost = requestHost.split(":")[0];
  }

  requestHost = requestHost.toLowerCase().trim();
  // logger.info("Request Host:", requestHost);

  const allowedHosts = config.ALLOWED_HOSTS.split(",").map((host) =>
    host.toLowerCase().trim(),
  );
  // logger.info("Allowed Hosts:", allowedHosts);

  if (allowedHosts.includes(requestHost)) {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Invalid host" }); // Block the request
  }
};

export function generateTransactionId() {
  const timestamp = Date.now().toString().slice(-7); // last 7 digits of timestamp
  const random = Math.floor(100000 + Math.random() * 900000); // 6-digit random
  const txid = timestamp + random.toString().slice(0, 3); // 7 + 5 = 12 digits
  return `TXN${txid}`; // 7 + 5 = 12 digits
}

export const formatedDateOnly = (date) => {
  if (!date || !moment(date).isValid()) return "NA";
  return moment(date).tz("Asia/Kolkata").format("DD-MM-YYYY");
};

export const formatedDateWithTime = (date) => {
  if (!date || !moment(date).isValid()) return "NA";
  return moment(date).tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm");
};

// helper to normalize ranking for comparison
export const normalizeRanking = (arr) =>
  arr.map((r) => ({
    id: r.user._id,
    rank: r.rank,
    score: r.score ?? 0, // default if missing
  }));

export const filterNullValue = (obj = {}) => {
  const filteredBody = {};

  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      filteredBody[key] = obj[key];
    }
  }

  return filteredBody;
};

export const hasPermission = (user, permission) => {
  const perms = user?.permissions ?? [];
  return perms?.includes("all_access") || perms?.includes(permission);
};
