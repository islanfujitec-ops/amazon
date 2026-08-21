# 🔑 ENCONTRAR CREDENCIAIS - GUIA PASSO A PASSO

## ⚠️ PROBLEMA COMUM

Muitos usuários não acham onde gerar as credenciais. Este guia mostra **exatamente onde clicar**!

---

## 📍 CAMINHO EXATO NO PORTAL

### **OPÇÃO 1: Via Creators API (RECOMENDADO)**

1. Acesse: **https://associados.amazon.com.br/**
2. Faça login com sua conta
3. No menu superior, procure por:
   - **"Ferramentas"** ou **"Tools"**
   - **"Creators API"** ou **"Product Advertising API"**

4. Clique em:
   - **"Registre-se"** ou **"Register"** 
   - **"Gerar Credenciais"** ou **"Generate Credentials"**

5. Você receberá:
   ```
   Credential ID: amzn1.cr.XXXXXXXXX
   Credential Secret: seu_secret_aqui
   Partner Tag: seu-partner-tag-20
   ```

---

### **OPÇÃO 2: Via Central de Associados**

1. Acesse: **https://associados.amazon.com.br/**
2. Procure no menu lateral esquerdo por:
   - **"Gerenciar Credenciais"** 
   - **"Manage Credentials"**
   - **"Configurações"** ou **"Settings"**

3. Procure pela seção:
   - **"Product Advertising API"**
   - **"Chaves de Acesso"** (Access Keys)

4. Clique em **"Nova Credencial"** ou **"+ Adicionar"**

---

### **OPÇÃO 3: Se ainda não achar**

Se depois de procurar não encontrar, use o **SUPORTE**:

1. No portal, clique em **"Fale Conosco"** ou **"Contato"**
2. Envie mensagem:
   ```
   Assunto: Como gerar credenciais para Creators API?
   
   Mensagem:
   "Preciso gerar credenciais (Credential ID, Credential Secret, Partner Tag) 
   para integrar a API de Associados em minha ferramenta. 
   Onde exatamente posso fazer isso no portal?"
   ```

3. A Amazon enviará instruções diretas

---

## 🎁 ALTERNATIVA: Sem API (Funcionamento Básico)

Se você **não conseguir** gerar credenciais agora, a ferramenta ainda funciona:

### ✅ Funciona NORMALMENTE:
- Monitora preços (scraping público)
- Armazena histórico
- Envia alertas via WhatsApp
- Dashboard completo
- 27 marcas configuradas

### ❌ Sem API:
- Não tem links de afiliado automáticos
- Busca mais lenta (scraping em vez de API)

---

## 💡 DICA IMPORTANTE

Se você **não tem Partner Tag** ainda:

1. Confira se está registrado no **Programa de Associados da Amazon**
2. Se não estiver, acesse: https://associados.amazon.com.br/
3. Clique em **"Aderir ao Programa"** ou **"Join Program"**
4. Preencha os dados solicitados
5. Aguarde aprovação (geralmente leva poucas horas)
6. Depois gere as credenciais

---

## ✅ CHECKLIST

- [ ] Tenho conta no associados.amazon.com.br
- [ ] Estou registrado no Programa de Associados
- [ ] Encontrei Credential ID
- [ ] Encontrei Credential Secret
- [ ] Encontrei Partner Tag
- [ ] Preenchi .env.amazon com os valores
- [ ] Reiniciei o servidor

---

## 📱 PRÓXIMO PASSO

Assim que tiver as 3 credenciais, **preencha** este arquivo:

**Arquivo:** `C:\Users\Dell\Desktop\CLAUDE\price-monitor-games\.env.amazon`

**Com:**
```env
AMAZON_CREDENTIAL_ID=SEU_CREDENTIAL_ID
AMAZON_CREDENTIAL_SECRET=SEU_CREDENTIAL_SECRET
AMAZON_PARTNER_TAG=SEU_PARTNER_TAG
AMAZON_MARKETPLACE=BR
AMAZON_REGION=us-east-1
```

Depois reinicie clicando 2x em **INICIAR.ps1** ✅

---

**Ainda não achou? Fale com suporte da Amazon diretamente!** 📞
