const axios  = require("axios");
const search = require("./serpapi");

const validateEmail = (email) => {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { valid: false, error: "Format email tidak valid" };
  }
  const [local, domain] = clean.split("@");
  return { valid: true, email: clean, local, domain };
};

// LeakCheck.io public API
const checkLeakCheck = async (email) => {
  try {
    const { data } = await axios.get(
      `https://leakcheck.io/api/public?check=${encodeURIComponent(email)}`,
      { timeout: 8000 }
    );
    return {
      found:   data.found   || 0,
      sources: (data.sources || []).map((s) =>
        typeof s === "string" ? s : s.name || JSON.stringify(s)
      ),
    };
  } catch (err) {
    console.warn(`[Email] LeakCheck gagal: ${err.message}`);
    return { found: 0, sources: [] };
  }
};

// Google Dork untuk eksposur email di internet publik
const buildDorks = (email) => [
  `"${email}"`,
  `site:pastebin.com "${email}"`,
  `site:github.com "${email}"`,
  `site:scribd.com "${email}"`,
  `filetype:sql "${email}"`,
  `filetype:csv "${email}"`,
  `"${email}" password`,
  `"${email}" "leaked"`,
];

const scanEmail = async (raw) => {
  const validation = validateEmail(raw);
  if (!validation.valid) return { valid: false, error: validation.error };

  const { email, local, domain } = validation;

  // Jalankan LeakCheck + Dork secara paralel
  const [leakResult, ...dorkResults] = await Promise.allSettled([
    checkLeakCheck(email),
    ...buildDorks(email).map((q) =>
      search(q).catch(() => [])
    ),
  ]);

  // Hasil LeakCheck
  const leak = leakResult.status === "fulfilled"
    ? leakResult.value
    : { found: 0, sources: [] };

  // Hasil Dork
  const findings = [];
  const dorks    = buildDorks(email);
  dorkResults.forEach((res, i) => {
    if (res.status !== "fulfilled") return;
    const pages = res.value;
    for (const page of pages) {
      if (!page) continue;
      for (const item of page) {
        if (item && item.link) {
          findings.push({
            url:     item.link,
            title:   item.title   || "",
            snippet: item.snippet || "",
            source:  (() => { try { return new URL(item.link).hostname; } catch { return item.link; } })(),
            query:   dorks[i],
          });
        }
      }
    }
  });

  const totalExposure = leak.found + findings.length;
  const isLeaked      = leak.found > 0 || findings.length > 0;

  let riskLevel;
  if (!isLeaked)               riskLevel = "AMAN";
  else if (totalExposure >= 8) riskLevel = "KRITIS";
  else if (totalExposure >= 4) riskLevel = "TINGGI";
  else                         riskLevel = "SEDANG";

  return {
    valid: true,
    email,
    local,
    domain,
    // LeakCheck
    breachCount:   leak.found,
    breachSources: leak.sources,
    // Dork
    dorkCount:     findings.length,
    findings,
    // Gabungan
    isLeaked,
    totalExposure,
    riskLevel,
    scannedAt: new Date().toISOString(),
  };
};

module.exports = { scanEmail, validateEmail };
