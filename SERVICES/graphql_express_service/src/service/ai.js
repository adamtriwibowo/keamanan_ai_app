const axios = require("axios");

const analyzeLeaks = async (leakItems) => {
  const bocor = leakItems.filter((i) => i.leakStatus === 1);

  if (bocor.length === 0) {
    return {
      riskLevel: "AMAN",
      summary: "Tidak ada kebocoran data yang terdeteksi.",
      recommendations: ["Tetap pantau secara berkala."],
    };
  }

  const dataContext = bocor
    .map(
      (i) =>
        `- Email: ${i.email}, No: ${i.phone}, Sumber bocor: ${
          i.leakLocation?.join(", ") || "tidak diketahui"
        }`
    )
    .join("\n");

  const prompt = `Kamu adalah analis keamanan siber. Analisis data kebocoran berikut dan berikan:
1. Tingkat risiko (KRITIS/TINGGI/SEDANG/RENDAH)
2. Ringkasan singkat kebocoran (2-3 kalimat dalam bahasa Indonesia)
3. 3 rekomendasi tindakan konkret

Data kebocoran:
${dataContext}

Jawab dalam format JSON:
{
  "riskLevel": "...",
  "summary": "...",
  "recommendations": ["...", "...", "..."]
}`;

  const { data } = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
      },
    }
  );

  const content = data.choices[0].message.content;
  return JSON.parse(content);
};

module.exports = { analyzeLeaks };
