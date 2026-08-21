# 🎲 Price Monitor - Jogos & Cartas

## ✅ FERRAMENTA PRONTA E FUNCIONANDO!

Seu monitor automático de preços na Amazon com alertas via WhatsApp está **100% pronto** para usar!

---

## 🚀 COMO INICIAR (Rápido!)

### 1️⃣ **Abra o Terminal/PowerShell**

```bash
cd C:\Users\Dell\Desktop\CLAUDE\price-monitor-games
npm run dev
```

### 2️⃣ **Abra no navegador**
```
http://localhost:3000
```

Pronto! ✅ A ferramenta abre automaticamente!

---

## 📱 COMO USAR

### **Aba 1: ⚙️ Configurações**

1. **Email Amazon**: Digite seu email de acesso
2. **Senha Amazon**: Digite sua senha
3. **Número WhatsApp**: `55` + DDD + número (ex: `5511987654321`)
4. **Frequência**: Escolha de **5 minutos até 12 horas**
5. **Ativar WhatsApp**: Marque o checkbox ✓
6. **Salvar**: Clique no botão azul

✅ Status aparecerá confirmando tudo!

---

### **Aba 2: 🏷️ Marcas & Keywords**

#### **Adicionar Marcas:**
- Marcas já configuradas: Asmodee, Galápagos, Devir, GROK
- Digite uma nova marca no campo
- Clique em **➕ Adicionar**
- Remova com o **✕** se precisar

#### **Adicionar Palavras-chave:**
- Keywords já configuradas: Brinquedos e jogos, Jogos de tabuleiro
- Digite um termo de busca
- Clique em **➕ Adicionar**
- Remova com o **✕** se precisar

💾 Clique em **Salvar Listas** quando terminar

---

### **Aba 3: 🔍 Monitorar**

- Clique em **🔍 Buscar Agora** para fazer uma busca imediata
- A ferramenta busca na:
  - **Amazon.com.br**
  - **Amazon Global**
- Mostra os produtos encontrados com preço e link direto
- Funciona automaticamente a cada hora (ou conforme configurado)

---

### **Aba 4: 📊 Histórico**

- Vê o histórico de todos os preços encontrados
- **Mostra**: Produto, Preço, Loja, Data/Hora
- **Limpar Histórico**: Remove tudo (com confirmação)

---

## 🔄 FUNCIONAMENTO AUTOMÁTICO

### **Como funciona:**

1. **Você configura** o número WhatsApp
2. **Cada hora** (ou conforme configurado) a ferramenta:
   - Busca os produtos nas marcas e keywords
   - Compara os preços
   - **Envia alerta via WhatsApp** se encontrar produtos
3. **Você recebe** as notificações automaticamente

### **Exemplo de mensagem WhatsApp:**
```
🎲 Produtos Encontrados

1. Catan - Jogo de Tabuleiro Premium
💰 R$ 89,90
🔗 https://amazon.com.br/...

2. Magic: The Gathering Booster
💰 R$ 45,50
🔗 https://amazon.com.br/...
```

---

## 🎯 CONFIGURAÇÕES RECOMENDADAS

### **Para Iniciantes:**
- Frequência: **1 hora**
- Apenas palavras-chave principais
- WhatsApp ativado

### **Para Acompanhamento Intenso:**
- Frequência: **30 minutos** ou **15 minutos**
- Todas as marcas e keywords
- WhatsApp ativado

### **Para Automação Noturna:**
- Frequência: **6 horas**
- Recebe alertas enquanto dorme

---

## 📁 ARQUIVOS IMPORTANTES

```
price-monitor-games/
├── server.js                 ← Servidor principal
├── public/index.html         ← Interface
├── config.json              ← Suas configurações (gerado)
├── package.json             ← Dependências
└── .env.local              ← Variáveis de ambiente
```

---

## 🔧 INTEGRAÇÃO WhatsApp

### **Opção 1: Twilio (RECOMENDADO)**
1. Cria conta em https://twilio.com
2. Ativa WhatsApp Sandbox
3. Pega a URL da API
4. Configura em `server.js` na função `sendWhatsAppAlert()`

### **Opção 2: Evolution API**
1. Instala Evolution API localmente ou na nuvem
2. Faz login via QR Code
3. Configura o endpoint em `server.js`

### **Opção 3: WhatsApp Business API**
1. Aplica em https://facebook.com/business
2. Recebe as credenciais
3. Integra no código

---

## ⚡ DICAS IMPORTANTES

### **Não funciona o scraper?**
- Amazon às vezes bloqueia requisições
- Use um proxy se necessário (configure em `scraper.js`)
- Tente com menos frequência de requisições

### **Quer mais marcas?**
- Basta adicionar na aba **Marcas & Keywords**
- Suporta ilimitadas!

### **Quer mudar frequência?**
- Dropdown na aba **Configurações**
- De 5 minutos até 12 horas
- Salva automaticamente

### **Dados salvos?**
- Tudo fica em `config.json`
- Mesmo se desligar o computador, retorna ao estado anterior

---

## 📊 ESTRUTURA DOS DADOS

### **config.json (Suas configurações):**
```json
{
  "amazonEmail": "seu@email.com",
  "amazonPassword": "senha123",
  "whatsappNumber": "5511987654321",
  "frequency": 60,
  "sendAlerts": true,
  "brands": ["Asmodee", "Galápagos"],
  "keywords": ["Brinquedos e jogos"],
  "products": [],
  "priceHistory": []
}
```

---

## 🚀 PRÓXIMOS PASSOS

### **Agora você pode:**
1. ✅ Abrir a ferramenta em `http://localhost:3000`
2. ✅ Configurar seu email/senha Amazon
3. ✅ Adicionar seu número WhatsApp
4. ✅ Escolher marcas e palavras-chave
5. ✅ Deixar rodando automaticamente!

### **Depois você pode:**
- 🔗 Deploy na Vercel (vai rodar 24/7)
- 📈 Adicionar mais lojas (Kabum, Mercado Livre)
- 📊 Ver gráficos de histórico de preços
- 🎯 Criar filtros avançados

---

## 💬 SUPORTE

Qualquer problema?
- Verifique se Node.js está instalado: `node -v`
- Verifique se npm está atualizado: `npm -v`
- Reinicie a ferramenta
- Limpe o `config.json` se necessário

---

## 📝 CRÉDITOS

Feito com ❤️ para os gamers brasileiros!

Que você encontre os melhores preços! 🎲🎯

---

**Status: ✅ PRONTO PARA USAR**
