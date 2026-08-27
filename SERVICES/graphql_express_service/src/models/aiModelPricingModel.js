const mongoose = require("mongoose");

const aiModelPricingSchema = new mongoose.Schema({
  model:          { type: String, required: true, unique: true, trim: true },
  promptRate:     { type: Number, required: true, min: 0 }, // Rp / 1000 token prompt
  completionRate: { type: Number, required: true, min: 0 }, // Rp / 1000 token completion
}, { timestamps: true });

module.exports = mongoose.model("ai_model_pricing", aiModelPricingSchema);
