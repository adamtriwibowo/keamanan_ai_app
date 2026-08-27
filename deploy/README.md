# Deploy SecureWatch AI ke VPS (berdampingan dengan aplikasi lain)

Panduan ini mengasumsikan VPS Anda **sudah menjalankan aplikasi lain** —
semua langkah dirancang supaya aplikasi ini terisolasi total: folder sendiri,
proses pm2 sendiri, port sendiri, dan database (nama db) sendiri di dalam
MongoDB yang bisa dipakai bersama.

## Prasyarat di VPS

- Ubuntu/Debian dengan akses `sudo`
- Sudah bisa `git clone` ke GitHub (repo publik, tidak perlu token)

## Langkah 1 — Upload & jalankan setup

Salin folder `deploy/` ini ke VPS (atau langsung clone repo di VPS — skrip
`setup-vps.sh` akan clone repo-nya sendiri ke `/var/www/securewatch-ai`).

```bash
# Di VPS:
curl -fsSL -o setup-vps.sh https://raw.githubusercontent.com/adamtriwibowo/keamanan_ai_app/master/deploy/setup-vps.sh
bash setup-vps.sh
```

Skrip ini **check-first** untuk setiap komponen bersama (Node.js, MongoDB,
pm2) — kalau sudah terpasang (dipakai aplikasi lain), skrip tidak akan
menimpa/upgrade paksa, hanya memakainya.

## Langkah 2 — Cek port bentrok

```bash
sudo ss -tulpn | grep LISTEN
```

Pastikan port yang akan dipakai (default `5000`) belum dipakai aplikasi lain.
Kalau bentrok, ganti `PORT_GRAPHQL` di `.env` ke port lain yang bebas.

## Langkah 3 — Lengkapi `.env`

```bash
nano /var/www/securewatch-ai/.env
```

Isi minimal:
- `OPENROUTER_API_KEY` — dari https://openrouter.ai/keys
- `SERPAPI_API_KEY` — dari https://serpapi.com/manage-api-key
- `JWT_SECRET` — **wajib diganti**, jangan pakai default di kode. Generate:
  `openssl rand -hex 32`
- `PORT_GRAPHQL` — sesuaikan hasil pengecekan di Langkah 2

`MONGODB_URI` sudah diarahkan ke MongoDB lokal VPS (`mongodb://127.0.0.1:27017/keamananai`) —
database `keamananai` terpisah dari database aplikasi lain meski satu instance MongoDB.

## Langkah 4 — Jalankan dengan pm2

```bash
cd /var/www/securewatch-ai
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup   # ikuti instruksi yang muncul agar pm2 auto-start setelah reboot
```

Proses ini bernama **`securewatch-ai`** di pm2 — perintah `pm2 restart/stop/logs`
untuk aplikasi lain tidak akan terpengaruh selama Anda merujuk nama proses yang benar.

Cek status:

```bash
pm2 status securewatch-ai
pm2 logs securewatch-ai
```

## Langkah 5 — Buka firewall (kalau `ufw` aktif)

```bash
sudo ufw allow <PORT_GRAPHQL>/tcp
```

## Langkah 6 — Uji coba

```bash
curl http://127.0.0.1:<PORT_GRAPHQL>/login
```

Akses dari luar: `http://<IP-VPS>:<PORT_GRAPHQL>/login`

Login default (**ganti password ini setelah login pertama** — belum ada UI
ganti password, minta saya tambahkan kalau perlu):

```
Email    : admin@securewatch.id
Password : SecureWatch@2024
```

## Update aplikasi di kemudian hari

```bash
cd /var/www/securewatch-ai
bash deploy/update.sh
```

## Catatan

- **`puppeteer` di `package.json`**: paket ini ada di dependencies tapi
  **tidak dipakai** oleh server yang berjalan (`SERVICES/graphql_express_service`).
  Fitur scan (NIK/telepon/email) memakai SerpApi, bukan Puppeteer lokal.
  `npm install` akan tetap mengunduh Chromium (~200MB+) karena paket ini masih
  terdaftar — kalau mau mempercepat & meringankan instalasi di VPS, saya bisa
  hapus dependency yang tidak terpakai (`puppeteer`, `puppeteer-core`,
  `puppeteer-extra`, `puppeteer-extra-plugin-stealth`, `playwright`) dari
  `package.json`. Tinggal minta.
- Belum pakai domain/nginx sesuai pilihan Anda — akses masih lewat `IP:PORT`.
  Kalau nanti mau tambah domain, tinggal minta setup nginx reverse proxy +
  HTTPS (Let's Encrypt) di atas setup ini, tidak perlu ubah apa pun di sisi
  aplikasi.
