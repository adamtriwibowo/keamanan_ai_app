@echo off
title SecureWatch - Menghentikan Server
color 0E

echo.
echo  ==========================================
echo     MENGHENTIKAN SECUREWATCH SERVER
echo  ==========================================
echo.

:: Cari PID yang menggunakan port 5000
echo  [INFO] Mencari proses di port 5000...

set PID=
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find ":5000 " ^| find "LISTENING"') do (
    set PID=%%a
)

if not defined PID (
    echo  [INFO] Tidak ada server berjalan di port 5000.
    echo.
    pause
    exit /b 0
)

echo  [INFO] Menghentikan proses PID: %PID%...
taskkill /PID %PID% /F >nul 2>&1

if %errorlevel% equ 0 (
    color 0A
    echo  [OK] Server berhasil dihentikan.
) else (
    color 0C
    echo  [ERROR] Gagal menghentikan. Coba klik kanan HENTIKAN.bat lalu "Run as Administrator".
)

echo.
pause
