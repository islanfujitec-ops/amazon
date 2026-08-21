# 🔗 SETUP - API Amazon Associados

## ✅ STATUS ATUAL

Sua ferramenta **TABULEIRO360** está **100% integrada** com a API oficial do Amazon Associados!

---

## 📋 PRÓXIMAS ETAPAS (3 passos simples)

### **PASSO 1: Gerar Credenciais da Amazon** 🔑

1. Acesse: https://associados.amazon.com.br/
2. Faça login com sua conta
3. Vá para **Associates Central**
4. Clique em **Gerenciar credenciais**
5. Clique em **Nova credencial** ou **Gerar**
6. Você receberá:
   - **Credential ID** (exemplo: `amzn1.cr.1234567890abc`)
   - **Credential Secret** (exemplo: `abc1234567890def`)
   - **Partner Tag** (seu ID de afiliado, ex: `tabuleiro360-20`)

### **PASSO 2: Configurar .env.amazon** ⚙️

Abra o arquivo:
```
C:\Users\Dell\Desktop\CLAUDE\price-monitor-games\.env.amazon
```

E preencha COM SEUS VALORES REAIS:

```env
AMAZON_CREDENTIAL_ID=amzn1.cr.SEU_ID_AQUI
AMAZON_CREDENTIAL_SECRET=SEU_SECRET_AQUI
AMAZON_PARTNER_TAG=seu-partner-tag-20
AMAZON_MARKETPLACE=BR
AMAZON_REGION=us-east-1
```

**IMPORTANTE:**
- ❌ Nunca compartilhe estas credenciais
- ❌ Nunca coloque em código/git
- ✅ Guarde em local seguro

### **PASSO 3: Reiniciar o Servidor** 🚀

1. Feche a ferramenta (Ctrl+C no terminal)
2. Clique 2x em **INICIAR.ps1**
3. Pronto! A API está ativa

---

## 🎯 COMO USAR

### **Via Dashboard**

1. Abra http://localhost:3000
2. Vá para aba **🔍 Monitorar**
3. Clique **Buscar Agora**
4. Recebe produtos REAIS da Amazon com:
   - ✅ Preço oficial
   - ✅ Rating de clientes
   - ✅ Link de afiliado automático
   - ✅ Imagens

### **Via API (programático)**

#### Buscar produtos:
```bash
curl -X POST http://localhost:3000/api/amazon/search \
  -H "Content-Type: application/json" \
  -d '{"keywords": "Jogos de tabuleiro", "limit": 10}'
```

#### Buscar por ASIN:
```bash
curl -X POST http://localhost:3000/api/amazon/product \
  -H "Content-Type: application/json" \
  -d '{"asin": "B08XXXXX"}'
```

#### Verificar status:
```bash
curl http://localhost:3000/api/amazon/status
```

---

## 📊 O QUE VOCÊ CONSEGUE FAZER AGORA

✅ Monitorar preços em **tempo real**
✅ Buscar produtos por **marca ou palavra-chave**
✅ Obter **links de afiliado** automaticamente
✅ Ver **ratings de clientes**
✅ Salvar **histórico de preços**
✅ Receber **alertas via WhatsApp**

---

## 🐛 TROUBLESHOOTING

### **Credenciais não funcionam**
- Verifique se digitou corretamente em `.env.amazon`
- Confira se as credenciais não expirou
- Tente gerar novas credenciais

### **API retorna erro**
- Verifique internet
- Confirme que `.env.amazon` está na pasta raiz
- Reinicie o servidor

### **Sem resultados**
- Tente palavra-chave mais genérica
- Verifique Partner Tag

---

## 📞 SUPORTE

Erros? Verifique:
- `.env.amazon` existe e está preenchido
- Servidor reiniciado após configuração
- Credenciais válidas e não expiradas

---

**Pronto! Agora sua ferramenta busca produtos REAIS com links de afiliado!** 🎉

Toda busca através do TABULEIRO360 vai gerar comissão para você quando alguém comprar! 💰
