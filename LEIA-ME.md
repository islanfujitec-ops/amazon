# 🎲 TABULEIRO360 — Guia do Sistema

Site: **https://tabuleiro360.vercel.app**
Login: `admintabuleiro@360` / `admintabuleiro@360`

---

## ✅ O QUE JÁ FUNCIONA (real, testado)

| Recurso | Como funciona |
|---|---|
| **Site online** | Vercel, com login e dados salvos no Supabase (não perde nada) |
| **Ofertas por marca** | Suas 27 marcas → link de busca na Amazon com a sua tag |
| **Radar de promoções** | Puxa ao vivo do Compara Jogos os jogos que baixaram de preço |
| **Links de afiliado** | Todo link sai com a sua tag `tabuleiro3605-20` → **comissão é sua** |
| **Métricas de cliques** | Aba Métricas mostra em qual jogo o público mais clicou |
| **Envio automático WhatsApp** | Script no Windows Server envia sozinho no intervalo configurado |

---

## ✅ API DA AMAZON — LIBERADA (07/09/2026)

A Creators API foi liberada. Agora o sistema usa **dados reais da Amazon**:

- **Preço real** + **preço cheio riscado** + **% de desconto** (tudo da Amazon)
- **Link direto do produto** (`/dp/ASIN`) já com a sua tag — não é mais busca
- **Foto oficial** do produto

### Como funciona a busca de ofertas
1. Pega as suas **marcas** cadastradas (rotaciona 6 por vez, cobre todas ao longo do dia)
2. Busca cada uma como `"<marca> jogo de tabuleiro"` — isso evita ruído
   (searchIndex não funciona no marketplace BR; o termo faz o mesmo papel)
3. Filtra pelo **desconto mínimo** que você configurou (desconto REAL da Amazon)
4. Ordena pelo maior desconto e envia a quantidade configurada

## 🖥️ SERVIDOR DE ENVIO (Windows Server)

Pasta: `Desktop\360` — arquivos: `index.js`, `package.json`, `INICIAR.bat`

**Para ligar:** clique 2x no `INICIAR.bat` → escaneie o QR (só na 1ª vez) → deixe a janela aberta.

- Usa **whatsapp-web.js** (navegador real) — resolve o erro `not-acceptable` do Baileys
- Reaproveita um navegador já instalado (não baixa nada)
- Manda um "estou vivo" pro site a cada 1 min → aparece em **Status do Sistema**

### Se der problema:
| Erro | Solução |
|---|---|
| "nenhum navegador encontrado" | Instale o Google Chrome no servidor |
| Desconectou / pede QR | Rode o `INICIAR.bat` de novo e escaneie |
| Não envia | Veja no site se **Envio Automático** está ligado e o destino preenchido |

---

## ⚙️ CONFIGURAÇÕES (o que cada uma faz)

| Campo | Efeito real |
|---|---|
| **Grupo ou Número** | Para onde a mensagem vai (link do grupo ou +55DDNúmero) |
| **Frequência** | De quanto em quanto tempo envia |
| **Desconto mínimo** | Só entram jogos com queda de preço acima desse % |
| **Quantidade** | Quantos jogos por mensagem |
| **Envio Automático** | Liga/desliga o envio |

> A **tag de afiliado** fica no servidor (variável `AMAZON_PARTNER_TAG` no Vercel), **não** no painel — assim ninguém que acessar o site consegue trocar e roubar sua comissão.

---

## 🔧 ENDEREÇOS ÚTEIS (para testar)

| Link | Para quê |
|---|---|
| `/api/amazon/debug` | Testa se a API da Amazon liberou |
| `/api/pending-message` | Vê a mensagem que será enviada |
| `/api/metrics` | Cliques por jogo |
| `/api/server-status` | Se o servidor Windows está online |

---

## 📌 PRÓXIMO PASSO

**Destravar a Creators API da Amazon.** É o único item que falta para o sistema mostrar
preço real e link direto do produto. Todo o resto já está pronto e rodando.
