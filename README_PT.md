# 🎲 Price Monitor - Jogos & Cartas

**Monitor automático de preços na Amazon com alertas via WhatsApp**

---

## ⚡ INICIAR RÁPIDO (3 segundos!)

### Windows:
```powershell
# Clique 2x em INICIAR.ps1
```

Ou abra PowerShell e rode:
```powershell
cd C:\Users\Dell\Desktop\CLAUDE\price-monitor-games
.\INICIAR.ps1
```

### Mac/Linux:
```bash
cd ~/Desktop/CLAUDE/price-monitor-games
npm run dev
```

**Pronto!** Acesse: http://localhost:3000

---

## 📖 FUNCIONALIDADES

✅ **Busca automática** a cada hora (configurável)  
✅ **Amazon.com.br + Amazon Global**  
✅ **Alertas via WhatsApp** em tempo real  
✅ **20+ marcas** pré-configuradas  
✅ **Interface intuitiva** e fácil  
✅ **Tudo editável** (marcas, keywords, frequência)  

---

## 🎯 COMO USAR

### 1. Configure (⚙️ tab)
- Email Amazon
- Senha Amazon
- Número WhatsApp
- Frequência (5min até 12h)
- Ative notificações WhatsApp

### 2. Customize Marcas (🏷️ tab)
- Adicione/remova marcas
- Adicione/remova palavras-chave
- Salve

### 3. Monitore (🔍 tab)
- Clique "Buscar Agora"
- Vê produtos em tempo real
- Funciona automaticamente

### 4. Histórico (📊 tab)
- Vê todos os preços encontrados
- Limpa o histórico se quiser

---

## 📱 INTEGRAR COM WhatsApp

### Opção 1: Twilio (+ fácil)
1. Crie conta: https://twilio.com
2. Ative WhatsApp Sandbox
3. Configure em `server.js`

### Opção 2: Evolution API
1. Instale: https://github.com/EvolutionAPI/evolution-api
2. Faça login com QR Code
3. Configure endpoint

### Opção 3: WhatsApp Business API
1. Aplique: https://facebook.com/business
2. Configure credenciais
3. Integre ao código

---

## 🎯 MARCAS PRÉ-CONFIGURADAS

- Asmodee
- Galápagos
- Devir
- GROK
- Copag
- Ravensburg
- E muitas mais!

**Você pode adicionar/remover qualquer marca!**

---

## ⚙️ TECNOLOGIA

- **Backend**: Node.js + Express
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Scraping**: Cheerio + Axios
- **Agendamento**: node-cron
- **Armazenamento**: JSON local

---

## 📁 ARQUIVOS

```
price-monitor-games/
├── INICIAR.ps1          ← Clique para iniciar
├── COMO_USAR.md         ← Guia completo
├── server.js            ← Servidor
├── public/index.html    ← Interface
└── config.json          ← Suas configs (gerado)
```

---

## 🚀 DEPLOY NA VERCEL

```bash
npm install -g vercel
vercel
```

E sua ferramenta rodará **24/7 na nuvem!**

---

## 💡 DICAS

- Salva tudo em `config.json`
- Suporta quantas marcas/keywords quiser
- Frequência de 5 min até 12 horas
- Histórico de preços ilimitado
- WhatsApp em tempo real

---

## 🐛 PROBLEMAS?

**Scraper não funciona?**
- Amazon às vezes bloqueia
- Tente com frequência menor
- Use proxy se necessário

**WhatsApp não envia?**
- Verifique número (formato: 55XXXXXXXXXX)
- Confirme que está habilitado ✓
- Teste a API WhatsApp configurada

**Quer mais ajuda?**
- Veja `COMO_USAR.md`

---

## ✨ Pronto para usar!

Todos os campos são **totalmente editáveis** e as configurações são **salvas automaticamente**.

Que você encontre os melhores preços! 🎲

---

**Status: ✅ 100% FUNCIONAL**
