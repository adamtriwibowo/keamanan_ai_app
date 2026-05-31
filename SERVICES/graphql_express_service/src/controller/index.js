const { usersSchema } = require("../models/mongodb");
const serpAPI = require("../service/serpapi");
const getJson = require("../utils/getJson");
require("dotenv").config();


console.log(process.env.SERPAPI_API_KEY);
exports.dorkController = async (req,res) => {
  try {
    console.log("dorkController");
    const queryJson = await getJson();
    const dorks = queryJson.dorks;

    const results = [];
    for (const dork of dorks) {
      const query = dork.query;

      const response = await serpAPI(query);

      response.forEach((result) => {
        for (const item of result) {
          if (item.link) results.push(item.link);
        }
      });
    }
    res.status(200).json({
      message: "Success",
      data: results,
    });

    // const { query } = req.query;
    // if (!query) {
    //   return res.status(400).json({ error: "Query parameter is required" });
    // }

    //   serpAPI('tes')
    //     .then((data) => {
    //       const results = data[0];
    //       if (!results || results.length === 0) {
    //         return res.status(404).json({ error: "No results found" });
    //       }
    //       const finallResults = [];
    //       const filteredResults = results.filter((result) => {
    //         finallResults.push(result.link);
    //       });
    //       res.status(200).json({
    //         message: "Success",
    //         data: finallResults,
    //       });
    //     })
    //     .catch((error) => {
    //       console.error("Error from SerpAPI service:", error);
    //       res.status(500).json({ error: "Internal Server Error" });
    // });
  } catch (error) {
    console.error("Error in dorkController:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.addEmail = async (req, res) => {
  try {
    const requet = req.body;
    const phone = Object.keys(requet)[0];
    const email = requet[phone].email;
    const user = {
      email,
      status: 0,
    };
    const data = {
      [phone]: {
        email,
        status: 0,
      },
    };

    await usersSchema.create(data);
    if (!data) {
      return res.status(400).json({ error: "Phone or email is required" });
    }

    res.status(201).json({
      message: "Success Add Data",
      data: user,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getEmail = async (req, res) => {
  try {
    const result = await usersSchema.find();
    console.log(result);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


