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

REM whatsapp-web.js da versao CORRIGIDA (commit fixo do GitHub). A 1.34.7 do npm
REM cai com "Execution context was destroyed" quando o WhatsApp recarrega a pagina.
echo Instalando a versao corrigida do whatsapp-web.js...
call npm install "whatsapp-web.js@https://codeload.github.com/wwebjs/whatsapp-web.js/tar.gz/942d236a11ad68807308b058303ba5256915979c" --no-fund --no-audit --no-update-notifier --loglevel=error
echo.

echo [2/2] Iniciando... escaneie o QR Code quando aparecer.
echo.
:rodar
node index.js
if "%errorlevel%"=="3" (
    echo.
    echo Reabrindo em 5 segundos...
    timeout /t 5 /nobreak >nul
    goto rodar
)

echo.
echo O programa parou. Pressione uma tecla para fechar.
pause >nul
