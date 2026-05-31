const { getJson } = require("serpapi");
require("dotenv").config();
const search = async (query) => {
  try {
    const params = {
      engine: "google",
      q: query,
      api_key: process.env.SERPAPI_API_KEY,
    };
    const response = [];
    await getJson(params, (json) => {
        response.push(json["organic_results"]);
      if (json["error"]) {
        console.error("Error:", json["error"]);
      }
    });
    return response;
  } catch (error) {
    console.error("Error fetching data from SerpAPI:", error);
    throw error;
  }
};

module.exports = search;