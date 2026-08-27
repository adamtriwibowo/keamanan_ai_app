const search = require("./serpapi");

const PROVIDERS = {
  "0811": "Telkomsel", "0812": "Telkomsel", "0813": "Telkomsel",
  "0821": "Telkomsel", "0822": "Telkomsel", "0823": "Telkomsel",
  "0852": "Telkomsel", "0853": "Telkomsel", "0851": "Telkomsel",
  "0814": "Indosat",   "0815": "Indosat",   "0816": "Indosat",
  "0855": "Indosat",   "0856": "Indosat",   "0857": "Indosat",
  "0858": "Indosat",
  "0817": "XL Axiata", "0818": "XL Axiata", "0819": "XL Axiata",
  "0859": "XL Axiata", "0877": "XL Axiata", "0878": "XL Axiata",
  "0831": "Axis",      "0832": "Axis",      "0833": "Axis",
  "0838": "Axis",
  "0881": "Smartfren", "0882": "Smartfren", "0883": "Smartfren",
  "0884": "Smartfren", "0885": "Smartfren", "0886": "Smartfren",
  "0887": "Smartfren", "0888": "Smartfren", "0889": "Smartfren",
  "0895": "Three (3)", "0896": "Three (3)", "0897": "Three (3)",
  "0898": "Three (3)", "0899": "Three (3)",
};

const validatePhone = (raw) => {
  // Normalisasi: hapus spasi, strip, +62
  let clean = raw.replace(/[\s\-().]/g, "");
  if (clean.startsWith("+62")) clean = "0" + clean.slice(3);
  if (clean.startsWith("62") && clean.length > 10) clean = "0" + clean.slice(2);

  if (!/^0\d{8,12}$/.test(clean)) {
    return { valid: false, error: "Format nomor tidak valid (contoh: 08123456789)" };
  }

  const prefix4 = clean.substring(0, 4);
  const prefix3 = clean.substring(0, 3);
  const provider = PROVIDERS[prefix4] || null;

  // Deteksi telepon rumah (021, 031, dll)
  const isLandline = /^0[2-9]\d/.test(clean) && !clean.startsWith("08");

  return {
    valid: true,
    phone: clean,
    provider: isLandline ? "Telepon Rumah" : (provider || "Tidak Dikenal"),
    type: isLandline ? "Landline" : "Seluler",
    prefix: prefix4,
  };
};

const buildDorks = (phone) => {
  // Variasi format nomor untuk dork
  const intl = "+62" + phone.slice(1);       // +628123456789
  const intl2 = "62" + phone.slice(1);       // 628123456789
  return [
    `"${phone}"`,
    `"${intl}"`,
    `site:pastebin.com "${phone}"`,
    `site:github.com "${phone}"`,
    `site:truecaller.com "${phone}"`,
    `site:getcontact.com "${phone}"`,
    `filetype:sql "${phone}"`,
    `filetype:csv "${phone}"`,
  ];
};

const scanPhone = async (raw) => {
  const validation = validatePhone(raw);
  if (!validation.valid) return { valid: false, error: validation.error };

  const { phone, provider, type, prefix } = validation;
  const dorks    = buildDorks(phone);
  const findings = [];

  for (const query of dorks) {
    try {
      const results = await search(query);
      for (const page of results) {
        if (!page) continue;
        for (const item of page) {
          if (item && item.link) {
            findings.push({
              url:     item.link,
              title:   item.title   || "",
              snippet: item.snippet || "",
              source:  new URL(item.link).hostname,
              query,
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[Phone] Dork gagal "${query}": ${err.message}`);
    }
  }

  const isLeaked = findings.length > 0;
  let riskLevel;
  if (!isLeaked)              riskLevel = "AMAN";
  else if (findings.length >= 5) riskLevel = "KRITIS";
  else if (findings.length >= 3) riskLevel = "TINGGI";
  else                           riskLevel = "SEDANG";

  return {
    valid: true,
    phone,
    provider,
    type,
    prefix,
    isLeaked,
    leakCount: findings.length,
    findings,
    riskLevel,
    scannedAt: new Date().toISOString(),
  };
};

module.exports = { scanPhone, validatePhone };
