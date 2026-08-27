require("dotenv").config();

// ── DNS + MongoDB harus di atas segalanya ──
const dns      = require("dns");
const mongoose = require("mongoose");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
// Koneksi aktual dibuat oleh src/models/mongodb.js saat di-require di bawah;
// menghindari pemanggilan mongoose.connect() ganda yang memicu race condition.

const express  = require("express");
const path     = require("path");
const app      = express();
const helmet   = require("helmet");
const router   = require("./src/routes/index");
const cors     = require("cors");
const morgan   = require("morgan");
const { seedAdmin, login, verifyToken, requireAuth } = require("./src/service/authService");

// Middleware
app.use(morgan("dev"));
app.use(cors({ origin: "*" }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../login.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../index.html"));
});

// ── AUTH ENDPOINTS ──
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email dan password wajib diisi" });
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get("/api/auth/me", (req, res) => {
  const auth  = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Tidak terautentikasi" });
  const payload = verifyToken(token);
  if (!payload)  return res.status(401).json({ error: "Token kadaluarsa" });
  res.json({ name: payload.name, email: payload.email, role: payload.role });
});

app.use("/api", router);

// GRAPHQL
const { createHandler } = require("graphql-http/lib/use/express");
const resolvers = require("./src/resolver/resolver");
const { typeDefs } = require("./src/schema/schema");

app.use(
  "/graphql",
  createHandler({
    schema: typeDefs,
    rootValue: resolvers,
  })
);

const { analyzeLeaks } = require("./src/service/ai");
const { scanNIK }      = require("./src/service/nikScan");
const { scanPhone }    = require("./src/service/phoneScan");
const { scanEmail }    = require("./src/service/emailScan");
const ScanHistory      = require("./src/models/scanHistoryModel");
const AiUsageLog       = require("./src/models/aiUsageModel");
const AiModelPricing   = require("./src/models/aiModelPricingModel");
const {
  seedAiSettings,
  getAiBudget,
  setAiBudget,
} = require("./src/config/aiPricing");

// SSE — heartbeat untuk indikator koneksi sidebar
app.get("/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  res.write("data: ok\n\n");
  const interval = setInterval(() => res.write(": ping\n\n"), 25000);
  req.on("close", () => clearInterval(interval));
});

// AI Analysis endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { leakItems } = req.body;
    if (!leakItems || !Array.isArray(leakItems)) {
      return res.status(400).json({ error: "leakItems array required" });
    }
    const result = await analyzeLeaks(leakItems);
    res.json(result);
  } catch (err) {
    console.error("AI analyze error:", err.message);
    res.status(500).json({ error: "Gagal menganalisis data" });
  }
});

// ── PENGATURAN: DASHBOARD PENGGUNAAN MODEL AI ──
app.get("/api/ai-usage", async (req, res) => {
  try {
    const budget = await getAiBudget();
    const byModel = await AiUsageLog.aggregate([
      { $group: {
          _id:      "$model",
          requests: { $sum: 1 },
          tokens:   { $sum: "$totalTokens" },
          cost:     { $sum: "$estimatedCostIDR" },
      } },
      { $sort: { cost: -1 } },
    ]);
    const recent = await AiUsageLog.find().sort({ createdAt: -1 }).limit(20).lean();

    const used          = byModel.reduce((s, m) => s + m.cost, 0);
    const totalRequests = byModel.reduce((s, m) => s + m.requests, 0);
    const totalTokens   = byModel.reduce((s, m) => s + m.tokens, 0);

    res.json({
      budget,
      used,
      remaining:    Math.max(budget - used, 0),
      percentUsed:  budget > 0 ? Math.min((used / budget) * 100, 100) : 0,
      totalRequests,
      totalTokens,
      byModel,
      recent,
      note: "Estimasi simulasi berdasarkan token yang dipakai — model saat ini gratis (:free) di OpenRouter, angka biaya bukan tagihan riil.",
    });
  } catch (err) {
    console.error("AI usage error:", err.message);
    res.status(500).json({ error: "Gagal mengambil data penggunaan AI" });
  }
});

// ── PENGATURAN: CRUD ANGGARAN ──
app.put("/api/settings/ai-budget", requireAuth, async (req, res) => {
  try {
    const { budget } = req.body;
    const value = Number(budget);
    if (!Number.isFinite(value) || value < 0) {
      return res.status(400).json({ error: "Anggaran harus berupa angka >= 0" });
    }
    const saved = await setAiBudget(value);
    res.json({ budget: saved });
  } catch (err) {
    console.error("Update budget error:", err.message);
    res.status(500).json({ error: "Gagal memperbarui anggaran" });
  }
});

// ── PENGATURAN: CRUD TARIF PER MODEL ──
app.get("/api/settings/model-pricing", async (req, res) => {
  try {
    const list = await AiModelPricing.find().sort({ model: 1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil daftar tarif model" });
  }
});

app.post("/api/settings/model-pricing", requireAuth, async (req, res) => {
  try {
    const { model, promptRate, completionRate } = req.body;
    if (!model || !model.trim()) return res.status(400).json({ error: "Nama model wajib diisi" });
    const pr = Number(promptRate), cr = Number(completionRate);
    if (!Number.isFinite(pr) || pr < 0 || !Number.isFinite(cr) || cr < 0) {
      return res.status(400).json({ error: "Tarif harus berupa angka >= 0" });
    }
    const created = await AiModelPricing.create({ model: model.trim(), promptRate: pr, completionRate: cr });
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Model tersebut sudah ada" });
    console.error("Create model pricing error:", err.message);
    res.status(500).json({ error: "Gagal menambah tarif model" });
  }
});

app.put("/api/settings/model-pricing/:id", requireAuth, async (req, res) => {
  try {
    const { promptRate, completionRate } = req.body;
    const pr = Number(promptRate), cr = Number(completionRate);
    if (!Number.isFinite(pr) || pr < 0 || !Number.isFinite(cr) || cr < 0) {
      return res.status(400).json({ error: "Tarif harus berupa angka >= 0" });
    }
    const updated = await AiModelPricing.findByIdAndUpdate(
      req.params.id,
      { promptRate: pr, completionRate: cr },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Tarif model tidak ditemukan" });
    res.json(updated);
  } catch (err) {
    console.error("Update model pricing error:", err.message);
    res.status(500).json({ error: "Gagal memperbarui tarif model" });
  }
});

app.delete("/api/settings/model-pricing/:id", requireAuth, async (req, res) => {
  try {
    await AiModelPricing.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus tarif model" });
  }
});

// ── PENGATURAN: CRUD RIWAYAT PEMANGGILAN AI ──
app.delete("/api/ai-usage/logs/:id", requireAuth, async (req, res) => {
  try {
    await AiUsageLog.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus riwayat" });
  }
});

app.delete("/api/ai-usage/logs", requireAuth, async (req, res) => {
  try {
    await AiUsageLog.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengosongkan riwayat" });
  }
});

// ── SCAN HISTORY ──
app.get("/api/scan-history", async (req, res) => {
  try {
    const { type, limit = 100 } = req.query;
    const filter = type ? { type: type.toUpperCase() } : {};
    const history = await ScanHistory.find(filter)
      .sort({ scannedAt: -1 })
      .limit(Number(limit))
      .lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil riwayat" });
  }
});

app.delete("/api/scan-history/:id", async (req, res) => {
  try {
    await ScanHistory.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus riwayat" });
  }
});

// helper: simpan ke history lalu kirim response
const saveAndRespond = async (res, type, result, extraFields = {}) => {
  if (result.valid && !result.error) {
    try {
      await ScanHistory.create({
        type,
        target:    result[type === "NIK" ? "nik" : type === "PHONE" ? "phone" : "email"],
        riskLevel: result.riskLevel,
        isLeaked:  result.isLeaked,
        leakCount: result.leakCount  || result.totalExposure || 0,
        findings:  (result.findings  || []).slice(0, 50),
        ...extraFields,
      });
    } catch (e) {
      console.warn("[History] Gagal simpan:", e.message);
    }
  }
  res.json(result);
};

// NIK / KTP Scan
app.post("/api/nik-scan", async (req, res) => {
  try {
    const { nik } = req.body;
    if (!nik) return res.status(400).json({ error: "NIK wajib diisi" });
    const result = await scanNIK(nik);
    await saveAndRespond(res, "NIK", result, {
      province: result.province,
      gender:   result.gender,
      dob:      result.dob,
    });
  } catch (err) {
    console.error("NIK scan error:", err.message);
    res.status(500).json({ error: "Gagal melakukan scan NIK" });
  }
});

// Phone Scan
app.post("/api/phone-scan", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Nomor telepon wajib diisi" });
    const result = await scanPhone(phone);
    await saveAndRespond(res, "PHONE", result, {
      provider:  result.provider,
      phoneType: result.type,
    });
  } catch (err) {
    console.error("Phone scan error:", err.message);
    res.status(500).json({ error: "Gagal melakukan scan nomor telepon" });
  }
});

// Email Scan
app.post("/api/email-scan", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email wajib diisi" });
    const result = await scanEmail(email);
    await saveAndRespond(res, "EMAIL", result, {
      breachCount:   result.breachCount,
      breachSources: result.breachSources,
      dorkCount:     result.dorkCount,
    });
  } catch (err) {
    console.error("Email scan error:", err.message);
    res.status(500).json({ error: "Gagal melakukan scan email" });
  }
});

// ── Start server setelah MongoDB siap ──
const PORT = process.env.PORT_GRAPHQL || 5000;

const startApp = async () => {
  try {
    await seedAdmin();
  } catch (e) {
    console.warn("[Seed] Dilewati (akan dicoba lagi saat login pertama):", e.message);
  }
  try {
    await seedAiSettings();
  } catch (e) {
    console.warn("[Seed] Pengaturan AI dilewati:", e.message);
  }
  app.listen(PORT, () => {
    console.log(`FRONTEND : http://localhost:${PORT}`);
    console.log(`LOGIN    : http://localhost:${PORT}/login`);
    console.log(`REST     : http://localhost:${PORT}/api/dorks`);
    console.log(`GRAPHQL  : http://localhost:${PORT}/graphql`);
    console.log(`SSE      : http://localhost:${PORT}/events`);
  });
};

if (mongoose.connection.readyState === 1) {
  console.log("[DB] MongoDB Atlas terhubung");
  startApp();
} else {
  mongoose.connection.once("open", () => {
    console.log("[DB] MongoDB Atlas terhubung");
    startApp();
  });
  mongoose.connection.once("error", (err) => {
    console.error("[DB] Koneksi gagal:", err.message);
    process.exit(1);
  });
}
