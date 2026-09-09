@echo off
chcp 65001 >nul
title TABULEIRO360 - Instalador Evolution API
color 0A
cd /d "%~dp0"

echo ============================================================
echo    TABULEIRO360 - INSTALADOR AUTOMATICO EVOLUTION API
echo ============================================================
echo.

REM ---------- 1. Verificar Docker ----------
echo [1/6] Verificando Docker...
where docker >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERRO] Docker nao encontrado neste computador.
    echo.
    echo    Instale o Docker Desktop primeiro:
    echo    https://www.docker.com/products/docker-desktop/
    echo.
    echo    Depois de instalar: reinicie o PC, abra o Docker Desktop
    echo    e rode este arquivo de novo.
    echo.
    pause
    exit /b
)
echo       Docker encontrado. OK.
echo.

REM ---------- 2. Verificar se Docker esta rodando ----------
echo [2/6] Verificando se o Docker esta ligado...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    color 0E
    echo.
    echo [ATENCAO] O Docker esta instalado mas nao esta rodando.
    echo    Abra o "Docker Desktop" e espere ficar verde,
    echo    depois rode este arquivo de novo.
    echo.
    pause
    exit /b
)
echo       Docker esta rodando. OK.
echo.

REM ---------- 3. Criar docker-compose.yml ----------
echo [3/6] Criando configuracao...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$y=@('services:','  evolution-api:','    image: atendai/evolution-api:v2.1.1','    container_name: evolution_api','    restart: always','    ports:','      - 8080:8080','    environment:','      - SERVER_URL=http://localhost:8080','      - AUTHENTICATION_API_KEY=tabuleiro360-chave-secreta-2026','      - DATABASE_ENABLED=true','      - DATABASE_PROVIDER=postgresql','      - DATABASE_CONNECTION_URI=postgresql://evolution:evolution@postgres:5432/evolution','      - DATABASE_SAVE_DATA_INSTANCE=true','      - CACHE_LOCAL_ENABLED=true','      - CONFIG_SESSION_PHONE_CLIENT=TABULEIRO360','      - QRCODE_LIMIT=30','    depends_on:','      - postgres','    volumes:','      - evolution_instances:/evolution/instances','  postgres:','    image: postgres:15','    container_name: evolution_postgres','    restart: always','    environment:','      - POSTGRES_USER=evolution','      - POSTGRES_PASSWORD=evolution','      - POSTGRES_DB=evolution','    volumes:','      - evolution_pgdata:/var/lib/postgresql/data','volumes:','  evolution_instances:','  evolution_pgdata:'); Set-Content -Path 'docker-compose.yml' -Value $y -Encoding ascii"
echo       Configuracao criada. OK.
echo.

REM ---------- 4. Liberar porta 8080 no firewall ----------
echo [4/6] Liberando porta 8080 no firewall do Windows...
netsh advfirewall firewall delete rule name="Evolution API 8080" >nul 2>&1
netsh advfirewall firewall add rule name="Evolution API 8080" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1
echo       Porta 8080 liberada. OK.
echo.

REM ---------- 5. Subir os containers ----------
echo [5/6] Subindo Evolution API (a 1a vez baixa ~500MB, aguarde)...
docker compose up -d
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERRO] Falha ao subir. Veja a mensagem acima.
    pause
    exit /b
)
echo       Containers no ar. OK.
echo.

REM ---------- 6. Aguardar e abrir painel ----------
echo [6/6] Aguardando o Evolution iniciar (20s)...
timeout /t 20 /nobreak >nul

echo.
echo ============================================================
echo    PRONTO! EVOLUTION API ESTA RODANDO.
echo ============================================================
echo.
echo    PAINEL:   http://localhost:8080/manager
echo    API KEY:  tabuleiro360-chave-secreta-2026
echo.

REM Descobrir o IP publico do servidor
echo    Descobrindo o IP publico deste servidor...
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Invoke-RestMethod -Uri https://api.ipify.org -TimeoutSec 8)" 2^>nul') do set PUBIP=%%i
echo    IP PUBLICO:  %PUBIP%
echo.
echo ------------------------------------------------------------
echo    PROXIMOS PASSOS:
echo    1. Vai abrir o painel no navegador
echo    2. Crie uma instancia chamada:  tabuleiro360
echo    3. Escaneie o QR Code com o WhatsApp que vai ENVIAR
echo       (esse WhatsApp precisa estar DENTRO do grupo)
echo    4. Me mande no chat:
echo         - IP PUBLICO acima:  %PUBIP%
echo         - Confirmacao que conectou (ficou verde)
echo    5. Eu configuro o resto no Vercel e pronto: envio automatico!
echo ------------------------------------------------------------
echo.

start http://localhost:8080/manager

echo    (Pode fechar esta janela depois de escanear o QR)
echo.
pause
