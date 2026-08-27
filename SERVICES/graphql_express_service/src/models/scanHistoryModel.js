const mongoose = require("mongoose");

const findingSchema = new mongoose.Schema({
  url:     String,
  title:   String,
  snippet: String,
  source:  String,
  query:   String,
}, { _id: false });

const scanHistorySchema = new mongoose.Schema({
  type:          { type: String, enum: ["NIK", "PHONE", "EMAIL"], required: true },
  target:        { type: String, required: true },
  riskLevel:     { type: String, enum: ["AMAN", "SEDANG", "TINGGI", "KRITIS"], required: true },
  isLeaked:      { type: Boolean, default: false },
  leakCount:     { type: Number, default: 0 },
  findings:      { type: [findingSchema], default: [] },
  // NIK extras
  province:      String,
  gender:        String,
  dob:           String,
  // Phone extras
  provider:      String,
  phoneType:     String,
  // Email extras
  breachCount:   { type: Number, default: 0 },
  breachSources: { type: [String], default: [] },
  dorkCount:     { type: Number, default: 0 },

  scannedBy:  { type: String, default: "admin" },
  scannedAt:  { type: Date, default: Date.now },
});

// Index untuk query cepat
scanHistorySchema.index({ type: 1, scannedAt: -1 });
scanHistorySchema.index({ target: 1 });

module.exports = mongoose.model("scan_histories", scanHistorySchema);
