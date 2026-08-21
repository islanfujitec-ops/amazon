# 🔧 TROUBLESHOOTING - ERRO 403 FORBIDDEN

## 📋 Diagnóstico do Erro 403

Você está recebendo:
```
HTTP 403 Forbidden
AccessDeniedException
```

**Após:** ✅ Token obtido com sucesso | ✅ Payload validado | ✅ Chamada da API feita

---

## 🎯 Causas Possíveis (pela documentação Amazon)

### **Causa 1: Conta não elegível** ⚠️ (MAIS PROVÁVEL)

**Requisito de elegibilidade:**
- ✅ Estar registrado no Programa de Associados
- ✅ Ter realizado **10 vendas qualificadas nos últimos 30 dias**

**Se você não atender:**
- ❌ Erro: 403 AccessDeniedException
- ❌ Razão: AssociateNotEligible

**Solução:**
1. Verifique seu histórico de vendas em: https://associados.amazon.com.br/
2. Se <10 vendas: Aguarde até completar os requisitos
3. Após atingir 10 vendas: Tente novamente em 1-2 horas

---

### **Causa 2: Autorização falhou** ⚠️

Mesmo com credencial ACTIVE, pode haver um problema de permissões específicas.

**Possíveis motivos:**
- Credencial vinculada errado ao marketplace
- Partner Tag não configurado corretamente
- Aplicação não foi aprovada para acesso à API

**Solução:**
1. Verifique em Associates Central:
   - Vá para: https://associados.amazon.com.br/
   - Menu: Ferramentas → Creators API
   - Procure por "tabuleiro360"
   - Verifique se o Partner Tag está vinculado corretamente

2. Se houver opção de "Ativar" ou "Autorizar API":
   - Clique nela
   - Aguarde a ativação

---

### **Causa 3: Outro motivo não documentado** ⚠️

**Neste caso:**
- Contacte Amazon diretamente
- Forneça:
  - Application ID: `tainadadecio-20.tabuleiro360`
  - Credential ID: `amzn1.application-oa2-client.9e83f6acd62145d593f61d33ec168deb`
  - Timestamp do erro
  - Payload enviado

---

## 🔍 COMO DESCOBRIR A CAUSA EXATA

### **Teste 1: Verificar elegibilidade de vendas**

```bash
# Verifique em:
https://associados.amazon.com.br/dashboard
```

Procure por:
- Vendas nos últimos 30 dias
- Se >= 10: pode ser outra causa
- Se < 10: essa é a causa

### **Teste 2: Validar credencial no portal**

1. Acesse: https://associados.amazon.com.br/
2. Vá para: Ferramentas → Creators API
3. Procure sua aplicação "tabuleiro360"
4. Verifique:
   - ✅ Status: ACTIVE
   - ✅ Partner Tag: tainadadecio-20
   - ✅ Marketplace: BR (Amazon.com.br)

### **Teste 3: Testar com curl detalhado**

```bash
# 1. Obter token
TOKEN_RESPONSE=$(curl -s -X POST https://api.amazon.com/auth/o2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=amzn1.application-oa2-client.9e83f6acd62145d593f61d33ec168deb&client_secret=YOUR_SECRET&scope=creatorsapi::default")

echo "Token Response:"
echo $TOKEN_RESPONSE

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

# 2. Chamar API com verbosidade
curl -v -X POST https://creatorsapi.amazon/catalog/v1/searchItems \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "x-marketplace: www.amazon.com.br" \
  -d '{
    "keywords": "teste",
    "partnerTag": "tainadadecio-20",
    "marketplace": "www.amazon.com.br",
    "maxResults": 1
  }'
```

Verifique a resposta detalhada para pistas sobre o motivo.

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Conta registrada no Programa de Associados? 
  - Verificar em: https://associados.amazon.com.br/dashboard

- [ ] Tem >= 10 vendas nos últimos 30 dias?
  - Sim: ✅ continue
  - Não: ❌ Aguarde ou complete vendas

- [ ] Partner Tag está ativo no portal?
  - Vá para: Ferramentas → Creators API
  - Procure "tabuleiro360"
  - Status = ACTIVE?

- [ ] Credencial está vinculada ao Partner Tag?
  - Mesmo em: Ferramentas → Creators API
  - Tem um botão "Ativar" ou "Autorizar"?
  - Se sim: Clique!

- [ ] Marketplace está correto?
  - Deve ser: `www.amazon.com.br`

- [ ] Token está sendo obtido com sucesso?
  - Rode teste 3 acima
  - Token aparece na resposta?

---

## 📞 TEMPLATE DE EMAIL PARA AMAZON

Se nenhum dos testes acima resolver, envie este email:

**Para:** suporte@associados.amazon.com.br  
**Assunto:** Erro 403 Forbidden - Creators API - [tainadadecio-20.tabuleiro360]

**Corpo:**

```
Olá time de suporte,

Estou recebendo erro 403 Forbidden ao tentar usar a Creators API.

DETALHES:
- Application ID: tainadadecio-20.tabuleiro360
- Credential ID: amzn1.application-oa2-client.9e83f6acd62145d593f61d33ec168deb
- Versão: 3.1
- Partner Tag: tainadadecio-20
- Marketplace: www.amazon.com.br

PROGRESSO TÉCNICO:
✅ Token OAuth2 obtido com sucesso
✅ Escopo: creatorsapi::default
✅ Payload validado
✅ Endpoint: https://creatorsapi.amazon/catalog/v1/searchItems
❌ Resposta: 403 Forbidden

VERIFICAÇÕES REALIZADAS:
□ Credencial status: ACTIVE (conforme portal)
□ Vendas nos últimos 30 dias: [NÚMERO]
□ Marketplace vinculado: Sim
□ Partner Tag ativo: Sim

PERGUNTA:
Por que recebo erro 403 ao chamar a API mesmo tendo:
1. Credencial ACTIVE
2. Token obtido com sucesso
3. Payload validado

Qual é o próximo passo para resolver este problema?

Obrigado!
```

---

## 🚀 SOLUÇÕES ENQUANTO AGUARDA RESPOSTA

### **Opção 1: Usar ferramenta com banco de dados**
- ✅ Funciona 100% agora
- ✅ Sem erros para usuários
- ✅ Quando API liberar: basta reiniciar

### **Opção 2: Usar SDK oficial Amazon**

Os SDKs oficiais incluem tratamento robusto de erros:

```javascript
// Exemplo com SDK Node.js
const CreatorsAPI = require('creatorsapi-nodejs-sdk');

const client = new CreatorsAPI.DefaultApi(
  'CREDENTIAL_ID',
  'CREDENTIAL_SECRET',
  'VERSION',
  'www.amazon.com.br'
);

// SDK gerencia:
// ✅ Autenticação automática
// ✅ Cache de tokens
// ✅ Tratamento de erros
// ✅ Retry automático
```

---

## 📊 RESUMO DE ERROS POSSÍVEIS

| Erro | Significado | Solução |
|------|------------|----------|
| **400** | Payload inválido | Verificar formato JSON |
| **401** | Token inválido/expirado | Obter novo token |
| **403** | Sem permissão | Verificar elegibilidade ou permissões |
| **404** | Recurso não encontrado | Verificar Partner Tag |
| **429** | Limite de requisições | Implementar retry com espera |
| **500** | Erro no servidor Amazon | Tentar novamente mais tarde |

---

## 💡 DICAS IMPORTANTES

1. **Token Cache:** Seu token é válido por 1 hora - não obtenha novo a cada requisição
2. **Retry:** Se receber erro 429/500, implemente espera exponencial
3. **Logs:** Ative logs detalhados para ver exatamente o que está sendo enviado
4. **SDKs:** Considere usar SDK oficial - resolve maioria dos problemas

---

## 🔄 PRÓXIMAS AÇÕES RECOMENDADAS

1. **Agora:** Verifique o checklist acima
2. **Se encontrar problema:** Resolva conforme sugerido
3. **Se não encontrar:** Envie email template para Amazon
4. **Enquanto aguarda:** Use ferramenta com banco de dados
5. **Quando liberar:** Reinicie servidor - API real automática

---

**Status:** Aguardando liberação de permissões da Amazon  
**Impacto:** Zero - ferramenta funciona normalmente com banco de dados  
**Próximo passo:** Contactar Amazon com informações acima
