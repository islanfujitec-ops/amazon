#!/bin/bash

echo "🎲 Price Monitor - Jogos & Cartas"
echo "=================================="
echo ""

# Verificar se Node.js está instalado
echo "✓ Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js não encontrado!"
    echo "  Baixe em: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js encontrado: $NODE_VERSION"
echo ""

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo "✓ Dependências instaladas!"
    echo ""
fi

# Iniciar servidor
echo "=========================================="
echo "✓ FERRAMENTA PRONTA!"
echo "=========================================="
echo ""
echo "📱 Abra no navegador: http://localhost:3000"
echo ""
echo "Pressione CTRL+C para parar"
echo ""

npm run dev
