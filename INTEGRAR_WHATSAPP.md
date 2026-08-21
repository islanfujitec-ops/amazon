# 📱 Como Integrar WhatsApp

Escolha uma das 3 opções abaixo:

---

## ✅ Opção 1: Twilio (MAIS FÁCIL - RECOMENDADO)

### Passo 1: Criar conta
1. Acesse: https://www.twilio.com/
2. Clique "Sign Up"
3. Complete o cadastro

### Passo 2: Ativar WhatsApp Sandbox
1. Dashboard → Messaging → Try it out → Send a WhatsApp message
2. Clique "Create a WhatsApp Sandbox"
3. Siga as instruções (adicione seu número)

### Passo 3: Obter credenciais
1. Dashboard → Account
2. Copie: Account SID e Auth Token
3. Dashboard → Messaging → Services
4. Copie a URL da API

### Passo 4: Configurar no código
Abra `server.js` e procure:

```javascript
async function sendWhatsAppAlert(phoneNumber, message) {
```

Substitua por:

```javascript
async function sendWhatsAppAlert(phoneNumber, message) {
  try {
    const accountSid = 'SEU_ACCOUNT_SID';
    const authToken = 'SEU_AUTH_TOKEN';
    const fromNumber = 'whatsapp:+1234567890'; // Seu número Twilio

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        From: fromNumber,
        To: `whatsapp:+${phoneNumber}`,
        Body: message
      },
      {
        auth: {
          username: accountSid,
          password: authToken
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Twilio error:', error.message);
    return { success: false, error: error.message };
  }
}
```

✅ **Pronto!** Salve e reinicie a ferramenta.

---

## ✅ Opção 2: Evolution API (FLEXÍVEL)

### Passo 1: Instalar localmente
```bash
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api
docker-compose up -d
```

Ou use cloud: https://evolution-api.com/

### Passo 2: Conectar WhatsApp
1. Acesse: http://localhost:8080
2. Scan o QR Code com WhatsApp
3. Copie a URL da API

### Passo 3: Configurar no código
Abra `server.js`:

```javascript
async function sendWhatsAppAlert(phoneNumber, message) {
  try {
    const evolutionUrl = 'http://localhost:8080/api';
    const apiKey = 'SEU_API_KEY';

    const response = await axios.post(
      `${evolutionUrl}/send/whatsapp`,
      {
        number: phoneNumber,
        text: message
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Evolution error:', error.message);
    return { success: false, error: error.message };
  }
}
```

✅ **Pronto!** Salve e reinicie.

---

## ✅ Opção 3: WhatsApp Business API (OFICIAL)

### Passo 1: Aplicar
1. Acesse: https://www.whatsapp.com/business/
2. Clique "Get WhatsApp Business App"
3. Preencha o formulário
4. Aguarde aprovação (pode levar 1-2 semanas)

### Passo 2: Obter credenciais
1. Após aprovação, você recebe:
   - Business Account ID
   - Access Token
   - Phone Number ID

### Passo 3: Configurar no código
```javascript
async function sendWhatsAppAlert(phoneNumber, message) {
  try {
    const businessAccountId = 'SEU_BUSINESS_ACCOUNT_ID';
    const accessToken = 'SEU_ACCESS_TOKEN';
    const phoneNumberId = 'SEU_PHONE_NUMBER_ID';

    const response = await axios.post(
      `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('WhatsApp API error:', error.message);
    return { success: false, error: error.message };
  }
}
```

✅ **Pronto!** Salve e reinicie.

---

## 🧪 TESTAR INTEGRAÇÃO

### Método 1: Via interface
1. Configure o número WhatsApp na aba ⚙️
2. Ative "Ativar notificações WhatsApp" ✓
3. Clique "Salvar Configurações"
4. Vá para 🔍 Monitorar
5. Clique "Buscar Agora"
6. Você deve receber uma mensagem no WhatsApp!

### Método 2: Via console
Abra o terminal e teste:

```bash
curl -X POST http://localhost:3000/api/monitor
```

Verifique se recebeu a mensagem no WhatsApp.

---

## 🐛 TROUBLESHOOTING

### Mensagem não chega?
1. ✓ Verifique formato do número: 55XXXXXXXXXX
2. ✓ Confirme que está ativado: checkbox marcado ✓
3. ✓ Teste a API diretamente
4. ✓ Verifique logs: `npm run dev`

### Erro de autenticação?
1. ✓ Confirme credentials corretas
2. ✓ Token não expirou?
3. ✓ IP liberado no firewall?

### Twilio não funciona?
1. ✓ Seu número foi adicionado ao Sandbox?
2. ✓ Sandbox ainda está ativo?
3. ✓ Limite de mensagens atingido?

### Evolution não funciona?
1. ✓ API está rodando? `docker-compose ps`
2. ✓ Número conectado? Verifique no dashboard
3. ✓ Firewall bloqueando porta 8080?

---

## 📌 RESUMO RÁPIDO

| Opção | Setup | Custo | Recomendado |
|-------|-------|-------|------------|
| **Twilio** | 5min | Grátis (teste) | ✅ SIM |
| **Evolution** | 10min | Grátis | ✅ SIM |
| **WhatsApp Business** | 2 semanas | Pago | Depois |

---

## 💡 DICA

Se não quer integrar WhatsApp agora:
- Deixe a ferramenta rodando
- Os produtos são salvos em `config.json`
- Integre WhatsApp depois quando quiser!

---

**Dúvidas? Consulte a documentação oficial:**
- Twilio: https://www.twilio.com/docs/whatsapp
- Evolution: https://github.com/EvolutionAPI/evolution-api
- WhatsApp: https://developers.facebook.com/docs/whatsapp/cloud-api

---

Boa sorte! 🎲
