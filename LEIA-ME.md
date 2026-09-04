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

## ⏳ O QUE FALTA (depende da Amazon, não do código)

**Falta a Amazon liberar a Creators API.** Hoje ela responde:
> `AssociateNotEligible — Your account does not currently meet the eligibility requirements`

Isso mesmo com as vendas feitas. É uma liberação do lado deles.

### O que muda quando liberarem:
- Hoje: link abre a **busca** na Amazon (comissão funciona)
- Depois: link abre a **página exata do produto**, com **preço real da Amazon** e foto

**O código já está pronto** (`lib/amazonApi.js`) — ativa sozinho quando a Amazon liberar.

### Como destravar:
1. Associados Amazon → Ferramentas → **CreatorsAPI** → ver se o acesso está ativo
2. Se continuar "não elegível", abrir chamado no **suporte de Associados** pedindo liberação da API
3. Testar depois em: `https://tabuleiro360.vercel.app/api/amazon/debug`
   - Se aparecer `"step": "sucesso"` → liberou! Me avise que eu ligo o preço real.

---

## ⚠️ IMPORTANTE: por que a mensagem não mostra preço

O **Compara Jogos** mostra preços de **lojas especializadas** (Javali, Alquimista...), **não da Amazon**.

Mostrar "R$ 53 na loja X" com link da Amazon seria **enganoso** — o preço na Amazon é outro.
Por isso a mensagem do WhatsApp manda **o nome do jogo + o seu link da Amazon**, sem preço inventado.

O Compara Jogos serve como **radar**: aponta quais jogos estão em promoção no mercado — e aí você divulga esses jogos com o seu link.

**Quando a API da Amazon liberar**, passamos a mostrar o preço REAL da Amazon (aí sim, honesto e completo).

---

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
