@echo off
chcp 65001 >nul
title TABULEIRO360 - Enviador de WhatsApp
cd /d "%~dp0"

echo ============================================
echo   TABULEIRO360 - Enviador de WhatsApp
echo ============================================
echo.

REM Verifica se o Node.js esta instalado
where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js NAO encontrado.
    echo.
    echo Instale o Node.js primeiro:
    echo   1. Abra: https://nodejs.org
    echo   2. Baixe a versao LTS ^(botao verde^)
    echo   3. Instale ^(next, next, finish^)
    echo   4. Rode este INICIAR.bat de novo
    echo.
    pause
    exit /b
)

echo [OK] Node.js encontrado:
node --version
echo.

REM Instala as dependencias na primeira vez
if not exist "node_modules" (
    echo [1/2] Instalando dependencias ^(so na primeira vez, pode demorar 1-2 min^)...
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
