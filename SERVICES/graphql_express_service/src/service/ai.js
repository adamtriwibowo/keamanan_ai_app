const axios = require("axios");

// Model gratis yang tersedia di OpenRouter (urutan prioritas)
const AI_MODELS = [
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "poolside/laguna-xs.2:free",
  "poolside/laguna-m.1:free",
];

// Ekstrak JSON dari respons model (beberapa model menambah teks di luar JSON)
const extractJson = (text) => {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

// Analisis berbasis aturan — fallback ketika AI tidak tersedia
const ruleBasedAnalysis = (leakItems) => {
  const bocor = leakItems.filter((i) => i.leakStatus === 1);
  const total = leakItems.length;
  const pct   = total > 0 ? (bocor.length / total) * 100 : 0;

  let riskLevel;
  if (bocor.length === 0)  riskLevel = "AMAN";
  else if (pct >= 75)      riskLevel = "KRITIS";
  else if (pct >= 50)      riskLevel = "TINGGI";
  else if (pct >= 25)      riskLevel = "SEDANG";
  else                     riskLevel = "RENDAH";

  const allSources = [...new Set(bocor.flatMap((i) => i.leakLocation || []))];

  const summary =
    bocor.length === 0
      ? `Dari ${total} data yang dipantau, tidak ada kebocoran yang terdeteksi. Sistem dalam kondisi aman.`
      : `Dari ${total} data yang dipantau, ${bocor.length} email terdeteksi bocor (${pct.toFixed(0)}%). ` +
        (allSources.length > 0
          ? `Sumber kebocoran meliputi: ${allSources.slice(0, 5).join(", ")}.`
          : "Sumber kebocoran belum teridentifikasi.");

  const recommendations =
    bocor.length === 0
      ? [
          "Lanjutkan pemantauan rutin secara berkala.",
          "Aktifkan autentikasi dua faktor (2FA) pada semua akun.",
          "Edukasi pengguna tentang pentingnya keamanan password.",
        ]
      : [
          `Segera ganti password untuk ${bocor.length} akun yang terdeteksi bocor.`,
          "Aktifkan autentikasi dua faktor (2FA) pada semua akun yang terdampak.",
          allSources.length > 0
            ? `Pantau aktivitas mencurigakan di platform: ${allSources.slice(0, 3).join(", ")}.`
            : "Laporkan insiden ke tim keamanan untuk investigasi lebih lanjut.",
        ];

  return { riskLevel, summary, recommendations, source: "rule-based" };
};

// Coba satu model AI
const tryModel = async (model, prompt) => {
  const { data } = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Analisis Kebocoran Data",
      },
      timeout: 20000,
    }
  );
  return data.choices[0].message?.content || null;
};

// Analisis hybrid: coba AI → fallback lokal
const analyzeLeaks = async (leakItems) => {
  const bocor = leakItems.filter((i) => i.leakStatus === 1);

  if (bocor.length === 0) return ruleBasedAnalysis(leakItems);

  const dataContext = bocor
    .map(
      (i) =>
        `- Email: ${i.email}, No HP: ${i.phone}, Sumber bocor: ${
          i.leakLocation?.join(", ") || "tidak diketahui"
        }`
    )
    .join("\n");

  const prompt = `Kamu adalah analis keamanan siber profesional. Analisis data kebocoran berikut:

${dataContext}

Berikan analisis dalam format JSON berikut (tidak ada teks lain selain JSON):
{
  "riskLevel": "KRITIS|TINGGI|SEDANG|RENDAH",
  "summary": "ringkasan 2-3 kalimat dalam bahasa Indonesia",
  "recommendations": ["rekomendasi 1", "rekomendasi 2", "rekomendasi 3"]
}`;

  // Coba setiap model AI secara berurutan
  for (const model of AI_MODELS) {
    try {
      console.log(`[AI] Mencoba model: ${model}`);
      const content = await tryModel(model, prompt);
      const parsed  = extractJson(content);

      if (parsed && parsed.riskLevel && parsed.summary && parsed.recommendations) {
        console.log(`[AI] Berhasil dengan model: ${model}`);
        return { ...parsed, source: "ai", model };
      }
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error?.message || err.message;
      console.warn(`[AI] Model ${model} gagal (${status}): ${msg}`);
    }
  }

  // Semua model gagal → gunakan analisis lokal
  console.warn("[AI] Semua model tidak tersedia, pakai analisis lokal.");
  return ruleBasedAnalysis(leakItems);
};

module.exports = { analyzeLeaks };
