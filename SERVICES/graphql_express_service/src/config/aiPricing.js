const AppSettings    = require("../models/appSettingsModel");
const AiModelPricing = require("../models/aiModelPricingModel");

const BUDGET_KEY  = "ai_budget_idr";
const PERCENT_KEY = "ai_usage_percent_override";
const DEFAULT_BUDGET_IDR = 4_000_000;

// Tarif fallback (Rp / 1000 token) kalau model belum punya entri di DB.
const DEFAULT_RATE = { promptRate: 10, completionRate: 30 };

// Data awal (seed) — model yang dipakai saat ini berlabel ":free" di OpenRouter
// (biaya asli Rp 0). Tarif di bawah ini SIMULASI untuk memperkirakan biaya
// seandainya model tersebut berbayar — bisa diubah lewat menu Pengaturan.
const DEFAULT_MODEL_PRICING = [
  { model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", promptRate: 8,  completionRate: 24 },
  { model: "poolside/laguna-xs.2:free",                          promptRate: 6,  completionRate: 18 },
  { model: "poolside/laguna-m.1:free",                           promptRate: 12, completionRate: 36 },
];

// Buat data anggaran & tarif default jika DB masih kosong
const seedAiSettings = async () => {
  const budgetExists = await AppSettings.findOne({ key: BUDGET_KEY });
  if (!budgetExists) {
    await AppSettings.create({ key: BUDGET_KEY, value: DEFAULT_BUDGET_IDR });
  }
  const pricingCount = await AiModelPricing.countDocuments();
  if (pricingCount === 0) {
    await AiModelPricing.insertMany(DEFAULT_MODEL_PRICING);
  }
};

const getAiBudget = async () => {
  const doc = await AppSettings.findOne({ key: BUDGET_KEY }).lean();
  return doc ? Number(doc.value) : DEFAULT_BUDGET_IDR;
};

const setAiBudget = async (value) => {
  const doc = await AppSettings.findOneAndUpdate(
    { key: BUDGET_KEY },
    { key: BUDGET_KEY, value },
    { upsert: true, new: true }
  );
  return Number(doc.value);
};

// % terpakai override manual — simulasi. Saat aktif, Rp terpakai & sisa
// anggaran ikut dihitung dari persentase ini (bukan dari token riil).
// null = pakai hitungan otomatis dari token yang benar-benar terpakai.
const getPercentOverride = async () => {
  const doc = await AppSettings.findOne({ key: PERCENT_KEY }).lean();
  return doc ? Number(doc.value) : null;
};

const setPercentOverride = async (value) => {
  const doc = await AppSettings.findOneAndUpdate(
    { key: PERCENT_KEY },
    { key: PERCENT_KEY, value },
    { upsert: true, new: true }
  );
  return Number(doc.value);
};

const clearPercentOverride = async () => {
  await AppSettings.findOneAndDelete({ key: PERCENT_KEY });
};

const estimateCostIDR = async (model, promptTokens = 0, completionTokens = 0) => {
  const pricing = await AiModelPricing.findOne({ model }).lean();
  const rate = pricing || DEFAULT_RATE;
  const cost = (promptTokens / 1000) * rate.promptRate + (completionTokens / 1000) * rate.completionRate;
  return Math.round(cost);
};

module.exports = {
  BUDGET_KEY,
  PERCENT_KEY,
  DEFAULT_BUDGET_IDR,
  DEFAULT_MODEL_PRICING,
  seedAiSettings,
  getAiBudget,
  setAiBudget,
  getPercentOverride,
  setPercentOverride,
  clearPercentOverride,
  estimateCostIDR,
};
