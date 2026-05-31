const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const leakDataSchema = new mongoose.Schema({}, { strict: false });
module.exports = {
  usersSchema: mongoose.model("leakemails", leakDataSchema),
};
