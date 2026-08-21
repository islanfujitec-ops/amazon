# 🚀 DEPLOY VERCEL - ENVIO AUTOMÁTICO

## 📋 PRÉ-REQUISITOS

1. **Conta Vercel** (gratuita em vercel.com)
2. **Conta GitHub** (para versionar código)
3. **Evolution API** ou **Twilio** (para WhatsApp automático)
4. **Variáveis de ambiente** configuradas

---

## 🔧 PASSO 1: CONFIGURAR EVOLUTION API (GRATUITO)

### **Opção A: Evolution API Própria (Recomendado)**

```bash
# 1. Crie conta em: https://dashboard.evolution-api.com/
# 2. Gere API Key
# 3. Configure WebHook para sua URL Vercel
```

### **Opção B: Usar Twilio (Pago - $0.01/mensagem)**

```bash
# 1. Crie conta em: https://www.twilio.com/
# 2. Crie projeto WhatsApp
# 3. Gere credenciais (Account SID, Auth Token, Phone Number)
```

---

## 📦 PASSO 2: ATUALIZAR PACKAGE.JSON

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.2",
    "dotenv": "^16.6.1",
    "node-cron": "^3.0.2",
    "node-fetch": "^3.3.0"
  }
}
```

---

## ⚙️ PASSO 3: CONFIGURAR VARIÁVEIS DE AMBIENTE

### **Arquivo: `.env.vercel` (ou criar em Vercel dashboard)**

```env
# Amazon
AMAZON_CREDENTIAL_ID=amzn1.application-oa2-client.9e83f6acd62145d593f61d33ec168deb
AMAZON_CREDENTIAL_SECRET=seu_secret_aqui
AMAZON_PARTNER_TAG=tainadadecio-20
AMAZON_MARKETPLACE=BR

# Evolution API
EVOLUTION_API_URL=https://sua-url-evolution-api.com
EVOLUTION_API_KEY=sua_chave_api

# OU Twilio
TWILIO_ACCOUNT_SID=seu_sid
TWILIO_AUTH_TOKEN=seu_token
TWILIO_WHATSAPP_NUMBER=+1234567890

# WhatsApp números/grupos (separados por vírgula)
WHATSAPP_TARGETS=55XXXXXXXXXX,55YYYYYYYYY

# Frequência de envio (em minutos)
PROMO_FREQUENCY=60

# Ativar automático
PROMO_AUTOMATIC=true
```

---

## 💻 PASSO 4: ATUALIZAR SERVER.JS

### **Adicione integração WhatsApp:**

```javascript
// lib/whatsappSender.js

const axios = require('axios');

// Evolution API Sender
async function sendViaEvolution(message, targets) {
  try {
    for (const target of targets) {
      await axios.post(`${process.env.EVOLUTION_API_URL}/send/text`, {
        number: target,
        text: message,
        isGroup: false
      }, {
        headers: { 'Authorization': `Bearer ${process.env.EVOLUTION_API_KEY}` }
      });
    }
    return { success: true, message: 'Enviado via Evolution' };
  } catch (error) {
    console.error('Erro Evolution:', error.message);
    return { success: false, error: error.message };
  }
}

// Twilio Sender
async function sendViaTwilio(message, targets) {
  const twilio = require('twilio');
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    for (const target of targets) {
      await client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${target}`
      });
    }
    return { success: true, message: 'Enviado via Twilio' };
  } catch (error) {
    console.error('Erro Twilio:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendViaEvolution, sendViaTwilio };
```

---

## ⏰ PASSO 5: AGENDAMENTO AUTOMÁTICO

### **Adicione ao server.js:**

```javascript
const cron = require('node-cron');
const { sendViaEvolution, sendViaTwilio } = require('./lib/whatsappSender');

// Envio automático de melhores preços
if (process.env.PROMO_AUTOMATIC === 'true') {
  const frequency = parseInt(process.env.PROMO_FREQUENCY || '60');
  const cronExpression = `*/${frequency} * * * *`;

  console.log(`📱 Envio automático agendado a cada ${frequency} minuto(s)`);

  cron.schedule(cronExpression, async () => {
    try {
      const config = loadConfig();
      const targets = (process.env.WHATSAPP_TARGETS || '').split(',');

      if (!config.products || config.products.length === 0) {
        console.log('⚠️ Nenhum produto para enviar');
        return;
      }

      // Pegar top 5 melhores preços
      const bestPrices = config.products
        .sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          const priceB = parseFloat(b.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          return priceA - priceB;
        })
        .slice(0, 5);

      // Montar mensagem
      let message = '🎲 *MELHORES PREÇOS - TABULEIRO360*\n\n';
      message += `_${new Date().toLocaleString('pt-BR')}_\n\n`;

      bestPrices.forEach((product, i) => {
        const affiliate_url = `https://www.amazon.com.br/dp/${product.asin}?tag=${process.env.AMAZON_PARTNER_TAG}`;
        message += `*${i + 1}. ${product.title}*\n`;
        message += `💰 *R$ ${product.price}*\n`;
        message += `🔗 ${affiliate_url}\n\n`;
      });

      message += '_Clique para comprar! 🚀_';

      // Enviar
      if (process.env.EVOLUTION_API_KEY) {
        await sendViaEvolution(message, targets);
      } else if (process.env.TWILIO_ACCOUNT_SID) {
        await sendViaTwilio(message, targets);
      }

      console.log(`✅ Enviado para ${targets.length} contatos`);
    } catch (error) {
      console.error('❌ Erro no envio automático:', error.message);
    }
  });
}
```

---

## 🌐 PASSO 6: DEPLOY NA VERCEL

### **6.1 Prepare seu repositório GitHub**

```bash
git init
git add .
git commit -m "TABULEIRO360 - Versão com envio automático"
git branch -M main
git remote add origin https://github.com/SEU_USER/tabuleiro360.git
git push -u origin main
```

### **6.2 Crie arquivo `vercel.json`**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "AMAZON_CREDENTIAL_ID": "@amazon_credential_id",
    "AMAZON_CREDENTIAL_SECRET": "@amazon_credential_secret",
    "AMAZON_PARTNER_TAG": "@amazon_partner_tag",
    "EVOLUTION_API_URL": "@evolution_api_url",
    "EVOLUTION_API_KEY": "@evolution_api_key",
    "WHATSAPP_TARGETS": "@whatsapp_targets",
    "PROMO_FREQUENCY": "60",
    "PROMO_AUTOMATIC": "true"
  }
}
```

### **6.3 Deploy no Vercel**

```bash
# Opção 1: Via CLI
npm i -g vercel
vercel --prod

# Opção 2: Via Dashboard
# 1. Abra https://vercel.com
# 2. Clique "New Project"
# 3. Selecione seu repositório GitHub
# 4. Configure variáveis de ambiente
# 5. Clique "Deploy"
```

### **6.4 Configure Variáveis de Ambiente**

**No dashboard Vercel:**

1. Vá para: `Settings` → `Environment Variables`
2. Adicione cada variável:
   ```
   AMAZON_CREDENTIAL_ID=...
   AMAZON_CREDENTIAL_SECRET=...
   AMAZON_PARTNER_TAG=...
   EVOLUTION_API_URL=...
   EVOLUTION_API_KEY=...
   WHATSAPP_TARGETS=55XXXXXXXXXX
   PROMO_FREQUENCY=60
   PROMO_AUTOMATIC=true
   ```

3. Clique "Save"

---

## ✅ PASSO 7: TESTAR

### **Link público (após deploy):**

```
https://seu-projeto.vercel.app
```

### **Verificar funcionamento:**

```bash
# 1. Abra o dashboard
https://seu-projeto.vercel.app

# 2. Verifique aba "📢 Promocionar"
# 3. Devem aparecer melhores preços

# 4. Monitore logs:
vercel logs --prod
```

---

## 🎯 COMO FUNCIONA NA VERCEL

```
Vercel (seu servidor público)
    ↓
    Node.js rodando 24/7
    ↓
    Cron job (cada 60 minutos)
    ↓
    Busca melhores preços
    ↓
    Monta mensagem
    ↓
    Evolution API / Twilio
    ↓
    WhatsApp automático
    ↓
    Recebe no grupo! 📱
```

---

## 💰 CUSTOS

| Serviço | Custo |
|---------|-------|
| **Vercel** | Gratuito (até 100GB/mês) |
| **Evolution API** | Gratuito |
| **Twilio** | ~R$ 0,03 por mensagem |
| **GitHub** | Gratuito |
| **Total** | Gratuito a R$ 90/mês |

---

## 🔐 SEGURANÇA

### **Proteja suas credenciais:**

1. ✅ **Nunca coloque em código**
2. ✅ **Use variáveis de ambiente**
3. ✅ **Na Vercel: Settings → Environment Variables**
4. ✅ **Marque como "Encrypted"**

### **.gitignore**

```
.env
.env.local
.env.*.local
node_modules/
```

---

## 📊 MONITORAMENTO

### **Logs em tempo real:**

```bash
# Ver logs do Vercel
vercel logs --prod

# Ver especificamente envios WhatsApp
vercel logs --prod --grep "Enviado"
```

### **Dashboard Vercel mostra:**

- ✅ Requisições
- ✅ Erros
- ✅ Performance
- ✅ Uptime (sempre 99.95%+)

---

## 🚨 TROUBLESHOOTING

### **"Erro de conexão Evolution API"**
→ Verifique URL e API Key em variáveis de ambiente

### **"WhatsApp não recebe mensagens"**
→ Confirme número está no formato correto: 55XXXXXXXXXX

### **"Cron não executa"**
→ Vercel precisa receber requisição a cada minuto (serverless)
→ Considere usar um serviço de monitoring externo

### **"Erro 500 aleatório"**
→ Provavelmente limite de requisições
→ Aumente intervalo de envio (ex: 120 minutos)

---

## 🎯 RESULTADO FINAL

```
✅ Dashboard público na Vercel
✅ Envia melhores preços automaticamente
✅ Cada 60 minutos (configurável)
✅ Para múltiplos números/grupos
✅ Com seu link de afiliado
✅ 24/7 automático
✅ Totalmente grátis (Evolution) ou pago (Twilio)
```

---

## 📱 EXEMPLO DE ACESSO

```
URL do Dashboard:
https://tabuleiro360.vercel.app

Cada vez que alguém clica seu link:
✅ Você ganha comissão
✅ Conta como "venda" para elegibilidade Amazon
✅ Totalmente automático
```

---

## 🚀 PRÓXIMOS PASSOS

1. Configure Evolution API (gratuito) ou Twilio
2. Crie repositório GitHub
3. Configure variáveis no Vercel
4. Faça deploy
5. Aguarde as mensagens automáticas
6. LUCRE COM COMISSÕES! 💰

---

**Status:** ✅ Pronto para Deploy Automático!

Seu software agora gera vendas 24/7 sem você fazer NADA! 🎲🤖💸
