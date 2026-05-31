const search = require("./serpapi");

const PROVINCES = {
  "11": "Aceh",                "12": "Sumatera Utara",
  "13": "Sumatera Barat",      "14": "Riau",
  "15": "Jambi",               "16": "Sumatera Selatan",
  "17": "Bengkulu",            "18": "Lampung",
  "19": "Kepulauan Bangka Belitung", "21": "Kepulauan Riau",
  "31": "DKI Jakarta",         "32": "Jawa Barat",
  "33": "Jawa Tengah",         "34": "DI Yogyakarta",
  "35": "Jawa Timur",          "36": "Banten",
  "51": "Bali",                "52": "Nusa Tenggara Barat",
  "53": "Nusa Tenggara Timur", "61": "Kalimantan Barat",
  "62": "Kalimantan Tengah",   "63": "Kalimantan Selatan",
  "64": "Kalimantan Timur",    "65": "Kalimantan Utara",
  "71": "Sulawesi Utara",      "72": "Sulawesi Tengah",
  "73": "Sulawesi Selatan",    "74": "Sulawesi Tenggara",
  "75": "Gorontalo",           "76": "Sulawesi Barat",
  "81": "Maluku",              "82": "Maluku Utara",
  "91": "Papua Barat",         "92": "Papua",
  "94": "Papua Selatan",       "95": "Papua Tengah",
  "96": "Papua Pegunungan",
};

// Validasi format NIK 16 digit
const validateNIK = (nik) => {
  const clean = nik.replace(/\s|-/g, "");
  if (!/^\d{16}$/.test(clean)) {
    return { valid: false, error: "NIK harus 16 digit angka" };
  }

  const provCode = clean.substring(0, 2);
  if (!PROVINCES[provCode]) {
    return { valid: false, error: `Kode provinsi "${provCode}" tidak dikenal` };
  }

  let day   = parseInt(clean.substring(6, 8));
  const mon = parseInt(clean.substring(8, 10));
  const yr  = parseInt(clean.substring(10, 12));

  // Perempuan: tanggal + 40
  const isFemale = day > 40;
  if (isFemale) day -= 40;

  if (day < 1 || day > 31 || mon < 1 || mon > 12) {
    return { valid: false, error: "Tanggal lahir di NIK tidak valid" };
  }

  // Estimasi tahun: <= 25 → 2000-an, lainnya → 1900-an
  const fullYear = yr <= 25 ? 2000 + yr : 1900 + yr;
  const dob = `${String(day).padStart(2, "0")}/${String(mon).padStart(2, "0")}/${fullYear}`;

  return {
    valid: true,
    province: PROVINCES[provCode],
    provinceCode: provCode,
    gender: isFemale ? "Perempuan" : "Laki-laki",
    dob,
    sequence: clean.substring(12),
  };
};

// Dork queries untuk mencari eksposur NIK di internet
const buildDorks = (nik) => [
  `"${nik}"`,
  `site:pastebin.com "${nik}"`,
  `site:github.com "${nik}"`,
  `site:scribd.com "${nik}"`,
  `filetype:sql "${nik}"`,
  `filetype:csv "${nik}"`,
];

const scanNIK = async (nik) => {
  const clean      = nik.replace(/\s|-/g, "");
  const validation = validateNIK(clean);

  if (!validation.valid) {
    return { valid: false, error: validation.error };
  }

  const dorks    = buildDorks(clean);
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
      console.warn(`[NIK] Dork gagal "${query}": ${err.message}`);
    }
  }

  const isLeaked = findings.length > 0;
  let riskLevel;
  if (!isLeaked)           riskLevel = "AMAN";
  else if (findings.length >= 5) riskLevel = "KRITIS";
  else if (findings.length >= 3) riskLevel = "TINGGI";
  else                           riskLevel = "SEDANG";

  return {
    valid: true,
    nik: clean,
    ...validation,
    isLeaked,
    leakCount: findings.length,
    findings,
    riskLevel,
    scannedAt: new Date().toISOString(),
  };
};

module.exports = { scanNIK, validateNIK };
