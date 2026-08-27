const mongoose = require("mongoose");

const aiUsageSchema = new mongoose.Schema({
  model:             { type: String, required: true },
  feature:           { type: String, default: "leak-analysis" },
  promptTokens:      { type: Number, default: 0 },
  completionTokens:  { type: Number, default: 0 },
  totalTokens:       { type: Number, default: 0 },
  estimatedCostIDR:  { type: Number, default: 0 },
  createdAt:         { type: Date, default: Date.now },
});

aiUsageSchema.index({ createdAt: -1 });
aiUsageSchema.index({ model: 1 });

module.exports = mongoose.model("ai_usage_logs", aiUsageSchema);
