Write-Host "🎲 Price Monitor - Jogos & Cartas" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""

# Verificar se Node.js está instalado
Write-Host "✓ Verificando Node.js..." -ForegroundColor Cyan
$nodeVersion = node -v 2>$null
if ($nodeVersion) {
    Write-Host "✓ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "  Baixe em: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit
}

# Instalar dependências se necessário
if (-not (Test-Path ".\node_modules")) {
    Write-Host ""
    Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
    npm install
    Write-Host "✓ Dependências instaladas!" -ForegroundColor Green
}

# Iniciar servidor
Write-Host ""
Write-Host "🚀 Iniciando ferramenta..." -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✓ FERRAMENTA PRONTA!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Abra no navegador: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione CTRL+C para parar" -ForegroundColor Gray
Write-Host ""

# Iniciar server
npm run dev
