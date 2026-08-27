import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

// Login dulu
await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'admin@securewatch.id');
await page.fill('input[type="password"]', 'SecureWatch@2024');
await page.click('button[type="submit"]');
await page.waitForURL('http://localhost:5000/', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(2000);

// Data Monitor
await page.click('text=Data Monitor');
await page.waitForTimeout(1500);
await page.screenshot({ path: 'C:/tmp/sw_monitor.png' });
console.log('DATA MONITOR OK');

// Deteksi NIK
await page.click('text=Deteksi NIK');
await page.waitForTimeout(1200);
await page.screenshot({ path: 'C:/tmp/sw_nik.png' });
console.log('NIK PAGE OK');

// Deteksi No. Telepon
await page.click('text=Deteksi No. Telepon');
await page.waitForTimeout(1200);
await page.screenshot({ path: 'C:/tmp/sw_phone.png' });
console.log('PHONE PAGE OK');

// Deteksi Email
await page.click('text=Deteksi Email');
await page.waitForTimeout(1200);
await page.screenshot({ path: 'C:/tmp/sw_email.png' });
console.log('EMAIL PAGE OK');

// Laporan
await page.click('text=Laporan');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'C:/tmp/sw_laporan.png' });
console.log('LAPORAN OK');

await browser.close();
