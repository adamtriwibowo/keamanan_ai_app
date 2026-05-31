const fs = require("fs-extra");

const path = require("path");

async function getJson() {
  try {
    const filePath = path.resolve(__dirname, "../data/query.json");
    const data = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(data);
    return json;
  } catch (err) {
    console.error("Error reading JSON file:", err);
    throw err;
  }
}


module.exports = getJson;
