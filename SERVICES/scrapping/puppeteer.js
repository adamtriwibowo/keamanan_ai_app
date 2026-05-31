const { default: puppeteer } = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());
const scrappingPassword = async (link, password) => {
  console.log("Sedang mengambil data...");
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--proxy-server=http://scraperapi-country=us:2299b6f6c646cfb1d01afaa743037589@scraperapi.proxy:8001",
    ],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );

  await new Promise((resolve) => setTimeout(resolve, 5000));

  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(link, {
    timeout: 0,
    waitUntil: "networkidle2",
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));
  await page.waitForSelector(".nav > li:nth-child(5) > a:nth-child(1)");
  await page.click(".nav > li:nth-child(5) > a:nth-child(1)");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await page.type("#Password", password, { delay: 300 });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  await page.keyboard.press("Enter");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const resultText = await page.$eval("#pwnedPasswordResult", (el) =>
    el.textContent.trim()
  );
  const containsNumber = await /\d/.test(resultText);

  data = {};

  if (containsNumber == true) {
    const heading = await page.$eval(
      "#pwnedWebsiteBanner > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h2:nth-child(1)",
      (el) => el.textContent
    );
    const contentPasswordPawned = await page.$eval(
      "#pwnedPasswordResult",
      (el) => el.textContent
    );
    const desc = await page.$eval(
      "#pwnedWebsiteBanner > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > p:nth-child(3)",
      (el) => el.textContent
    );
    const cleanDesc = desc.trim().replace(/\s+/g, " ");

    data = {
      title: heading,
      body: contentPasswordPawned,
      desc: cleanDesc,
    };
  } else {
    const heading = await page.$eval(
      "#noPwnage > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h2:nth-child(1)",
      (el) => el.textContent
    );
    const desc = await page.$eval(
      "#noPwnage > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > p:nth-child(2)",
      (el) => el.textContent
    );
    const cleanDesc = desc.trim().replace(/\s+/g, " ");

    data = {
      title: heading,
      desc: cleanDesc,
    };
  }

  await page.screenshot({ path:`./screenshot/${password}.png` });

  browser.close();
  return data;
};

(async () => {
  const data1 = await scrappingPassword(
    "https://haveibeenpwned.com/",
    "Mandywoakne2352"
  );
  console.log(data1);
})();

(async () => {
  const data2 = await scrappingPassword(
    "https://haveibeenpwned.com/",
    "fertabaik23"
  );
  console.log(data2);
})();
