import axios from "axios";
import config from "../config/config.js"; // adjust path accordingly

export const fetchLeadContact = async (queryParams) => {
  const url = "https://app.easyleadz.com/api/prod/"; // placeholder – check actual endpoint
  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    "api-key": config.EASYLEADS_API_KEY,
  };

  try {
    const response = await axios.get(url, {
      headers,
      params: queryParams, // e.g., { email: "example@company.com", name: "John Doe" }
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching contact:",
      error.response ? error.response.data : error.message,
    );
    throw error;
  }
};
