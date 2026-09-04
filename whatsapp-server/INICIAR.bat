@echo off
chcp 65001 >nul
title TABULEIRO360 - Enviador de WhatsApp
cd /d "%~dp0"

echo ============================================
echo   TABULEIRO360 - Enviador de WhatsApp v2
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js NAO encontrado. Instale em https://nodejs.org e rode de novo.
    pause
    exit /b
)

echo [OK] Node.js:
node --version
echo.

REM Nao baixar o Chromium do puppeteer (falha e nao precisa: usamos um navegador ja instalado)
set PUPPETEER_SKIP_DOWNLOAD=true

REM Limpa download corrompido do puppeteer (evita erro "executable is missing")
if exist "%USERPROFILE%\.cache\puppeteer" (
    rmdir /s /q "%USERPROFILE%\.cache\puppeteer" 2>nul
)

if not exist "node_modules\whatsapp-web.js" (
    echo [1/2] Instalando dependencias ^(rapido, sem baixar navegador^)...
    call npm install --no-fund --no-audit
    echo.
) else (
    echo [OK] Dependencias ja instaladas.
    echo.
)

echo [2/2] Iniciando... escaneie o QR Code quando aparecer.
echo.
node index.js

echo.
echo O programa parou. Pressione uma tecla para fechar.
pause >nul
