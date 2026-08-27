const path = require("path");

// Konfigurasi pm2 khusus SecureWatch AI — nama proses unik ("securewatch-ai")
// supaya tidak bentrok dengan proses pm2 milik aplikasi lain di VPS yang sama.
module.exports = {
  apps: [
    {
      name: "securewatch-ai",
      script: "SERVICES/graphql_express_service/index.js",
      cwd: path.resolve(__dirname, ".."),
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "logs/pm2-out.log",
      error_file: "logs/pm2-error.log",
      time: true,
    },
  ],
};
