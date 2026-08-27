@echo off
title SecureWatch - AI Keamanan

color 0A
echo.
echo  ==========================================
echo     SECUREWATCH - AI KEAMANAN
echo     Analisis Kebocoran Data Pribadi
echo  ==========================================
echo.

:: Cek Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js tidak ditemukan!
    echo  Silakan install dari: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Cek apakah node_modules sudah ada
if not exist "node_modules\" (
    echo  [INFO] Menginstall dependensi (hanya pertama kali)...
    echo.
    npm install
    if %errorlevel% neq 0 (
        color 0C
        echo  [ERROR] Gagal install dependensi!
        pause
        exit /b 1
    )
    echo.
)

:: Cek apakah .env ada
if not exist ".env" (
    color 0E
    echo  [PERINGATAN] File .env tidak ditemukan!
    echo  Pastikan file .env sudah dikonfigurasi.
    echo.
    color 0A
)

:: Cek apakah port 5000 sudah dipakai
netstat -ano 2>nul | find ":5000 " | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo  [INFO] Server sudah berjalan di port 5000
    echo.
    echo  Membuka browser...
    timeout /t 1 /nobreak >nul
    start "" "http://localhost:5000/login"
    echo.
    echo  Sistem aktif di: http://localhost:5000
    echo.
    pause
    exit /b 0
)

echo  [INFO] Menghubungkan ke MongoDB Atlas...
echo  [INFO] Memulai server di port 5000...
echo.

:: Buat folder logs jika belum ada
if not exist "logs\" mkdir logs

:: Jalankan server di background, simpan output ke log
start /b node SERVICES\graphql_express_service\index.js > logs\server.log 2>&1

:: Tunggu server siap (cek port terbuka, max 30 detik)
set /a count=0
:WAIT_LOOP
timeout /t 2 /nobreak >nul
set /a count+=1
netstat -ano 2>nul | find ":5000 " | find "LISTENING" >nul
if %errorlevel% equ 0 goto SERVER_READY
if %count% geq 15 goto TIMEOUT_ERROR
echo  [INFO] Menunggu server siap... (%count%/15)
goto WAIT_LOOP

:TIMEOUT_ERROR
color 0C
echo.
echo  [ERROR] Server gagal start dalam 30 detik.
echo  Cek log di: logs\server.log
echo.
pause
exit /b 1

:SERVER_READY
color 0A
echo.
echo  ==========================================
echo     SERVER BERHASIL BERJALAN!
echo  ------------------------------------------
echo   URL     : http://localhost:5000
echo   Login   : http://localhost:5000/login
echo.
echo   Email   : admin@securewatch.id
echo   Password: SecureWatch@2024
echo  ==========================================
echo.

:: Buka browser otomatis ke halaman login
timeout /t 1 /nobreak >nul
start "" "http://localhost:5000/login"

echo  [OK] Browser dibuka otomatis ke halaman login
echo  [INFO] Untuk menghentikan: jalankan HENTIKAN.bat
echo  [INFO] Log server: logs\server.log
echo.
echo  =========== LOG SERVER (live) ===========
echo.

:: Tampilkan log server secara live
node -e "const fs=require('fs');const p='logs/server.log';let s=0;if(fs.existsSync(p)){process.stdout.write(fs.readFileSync(p,'utf8'));s=fs.statSync(p).size;}setInterval(()=>{if(!fs.existsSync(p))return;const n=fs.statSync(p).size;if(n>s){const b=Buffer.alloc(n-s);const fd=fs.openSync(p,'r');fs.readSync(fd,b,0,n-s,s);fs.closeSync(fd);process.stdout.write(b.toString('utf8'));s=n;}},500);"
