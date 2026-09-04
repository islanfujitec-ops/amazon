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
    echo [ERRO] Node.js NAO encontrado.
    echo Instale em https://nodejs.org ^(versao LTS^) e rode de novo.
    echo.
    pause
    exit /b
)

echo [OK] Node.js:
node --version
echo.

REM Instala as dependencias. Na 1a vez baixa o navegador (Chromium) - pode demorar 3-5 min.
if not exist "node_modules\whatsapp-web.js" (
    echo [1/2] Instalando dependencias + navegador ^(1a vez: pode demorar 3-5 min^)...
    echo       NAO feche a janela. Aguarde ate aparecer o QR Code.
    call npm install
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
