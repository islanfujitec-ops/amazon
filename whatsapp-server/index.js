// TABULEIRO360 - Enviador automático de WhatsApp (whatsapp-web.js)
// Usa o WhatsApp Web real num navegador (igual ao Radar Petronect que funciona),
// o que resolve o erro "not-acceptable"/LID do Baileys. Sem Docker.
// Conecta por QR, e no intervalo configurado busca as ofertas no app e envia no grupo/número.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import qrcode from "qrcode-terminal";
import axios from "axios";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth, MessageMedia } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Acha um navegador Chromium/Chrome/Edge JÁ instalado no servidor (evita baixar).
// Prioriza o Chromium do Playwright (que o Radar Petronect usa e funciona aqui).
function acharNavegador() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;

  // 1) Chrome/Edge instalados primeiro: mais confiaveis com o whatsapp-web.js
  //    (o Chromium do Playwright as vezes trava sem dar erro)
  const fixos = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  for (const p of fixos) { try { if (fs.existsSync(p)) return p; } catch { /* ignora */ } }
  // 2) Chromium do Playwright (%LOCALAPPDATA%\ms-playwright\chromium-XXXX\chrome-win\chrome.exe)
  try {
    const plDir = path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
    if (fs.existsSync(plDir)) {
      for (const d of fs.readdirSync(plDir)) {
        if (d.toLowerCase().startsWith("chromium")) {
          for (const sub of ["chrome-win", "chrome-win64"]) {
            const exe = path.join(plDir, d, sub, "chrome.exe");
            if (fs.existsSync(exe)) return exe;
          }
        }
      }
    }
  } catch { /* ignora */ }

  // 2) Chromium baixado pelo puppeteer (se existir)
  try {
    const ppDir = path.join(process.env.USERPROFILE || "", ".cache", "puppeteer", "chrome");
    if (fs.existsSync(ppDir)) {
      for (const d of fs.readdirSync(ppDir)) {
        const exe = path.join(ppDir, d, "chrome-win64", "chrome.exe");
        if (fs.existsSync(exe)) return exe;
      }
    }
  } catch { /* ignora */ }

  return undefined;
}

// ===== CONFIG =====
const APP_URL = process.env.APP_URL || "https://www.tabuleiro360.shop";
const PULL_KEY = process.env.WA_PULL_KEY || "";
// ==================

let ready = false;
let lastSent = 0;

// Busca as ofertas: e uma chamada PESADA (o app consulta a Amazon, leva ~35s).
// So chamar na hora de enviar de verdade.
async function fetchOffer() {
  const url = `${APP_URL}/api/pending-message${PULL_KEY ? "?key=" + encodeURIComponent(PULL_KEY) : ""}`;
  const { data } = await axios.get(url, { timeout: 90000 });
  return data;
}

// Config do painel: leve e rapida, e o que o loop olha de minuto em minuto.
async function fetchSendConfig() {
  const url = `${APP_URL}/api/send-config${PULL_KEY ? "?key=" + encodeURIComponent(PULL_KEY) : ""}`;
  const { data } = await axios.get(url, { timeout: 15000 });
  return data;
}

async function sendHeartbeat() {
  try {
    await axios.post(
      `${APP_URL}/api/heartbeat${PULL_KEY ? "?key=" + encodeURIComponent(PULL_KEY) : ""}`,
      { whatsappConnected: ready, lastSent: lastSent || null },
      { timeout: 12000 }
    );
  } catch { /* ignora */ }
}

// Resolve o destino num chatId válido do whatsapp-web.js
async function resolverChatId(client, alvo) {
  const raw = String(alvo || "").trim();
  if (!raw) return null;

  // Link de convite de grupo -> entra e pega o id (@g.us)
  if (raw.includes("chat.whatsapp.com")) {
    const code = raw.split("chat.whatsapp.com/")[1].split(/[?/]/)[0];
    try {
      const groupId = await client.acceptInvite(code); // entra no grupo (ou retorna id se já membro)
      return groupId.includes("@g.us") ? groupId : `${groupId}@g.us`;
    } catch (e) {
      try {
        const info = await client.getInviteInfo(code);
        const id = info?.id?._serialized || info?.id;
        if (id) return String(id).includes("@g.us") ? id : `${id}@g.us`;
      } catch { /* segue */ }
      throw new Error("não consegui acessar o grupo pelo link (a conta precisa poder entrar)");
    }
  }

  // Já é um id pronto (@g.us / @c.us)
  if (raw.includes("@")) return raw;

  // Número -> resolve o id real (trata o esquema novo LID; montar na mão dá erro)
  const digitos = raw.replace(/\D/g, "");
  const numId = await client.getNumberId(digitos);
  if (!numId) throw new Error(`o número ${digitos} não está no WhatsApp (confira 55 + DDD)`);
  return numId._serialized;
}

// Avisa o site o que ja foi enviado (pra nunca repetir)
async function marcarEnviados(asins, titles, discounts, items) {
  try {
    await axios.post(`${APP_URL}/api/mark-sent`, { asins, titles, discounts, items }, { timeout: 15000 });
  } catch { /* ignora */ }
}

// Le a PAGINA REAL do produto no navegador que ja esta aberto (o mesmo do WhatsApp)
// e confirma frete gratis / cupom de checkout. A Creators API nao expoe esses dados,
// entao a unica forma verdadeira e ler a mesma pagina que o cliente vai ver.
// Se nao conseguir ler, retorna null e a mensagem sai SEM afirmar nada (nunca inventa).
async function verificarNaPagina(client, asin) {
  let page;
  try {
    const browser = client.pupBrowser;
    if (!browser) return null;

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`https://www.amazon.com.br/dp/${asin}`, {
      waitUntil: "domcontentloaded",
      timeout: 25000
    });

    const info = await page.evaluate(() => {
      // IMPORTANTE: lemos so os blocos do PRODUTO PRINCIPAL.
      // O texto da pagina inteira tem anuncios patrocinados com "Entrega GRATIS"
      // de OUTROS produtos - usar body.innerText faria a gente afirmar algo falso.
      const txt = (sel) => { const e = document.querySelector(sel); return e ? (e.innerText || "").trim() : ""; };
      const primeiro = (...sels) => { for (const s of sels) { const v = txt(s); if (v) return v; } return ""; };

      const entrega = primeiro("#deliveryBlockMessage", "#mir-layout-DELIVERY_BLOCK", "#delivery-block-ATF", "#promise-display");
      const estoque = primeiro("#availability");
      const preco   = primeiro("#corePriceDisplay_desktop_feature_div", "#apex_desktop", "#corePrice_feature_div");
      const promo   = primeiro("#promoPriceBlockMessage", "#applicable_promotion_list_sec", "#promotions_feature_div", "#vpcButton");
      const centro  = primeiro("#centerCol", "#dp-container");

      // valido so se o bloco do produto carregou (nao e captcha / pagina vazia)
      const paginaOk = (centro || preco).length > 100;
      if (!paginaOk) return { paginaOk: false };

      // Frete gratis + prazo. Ex.: "Entrega GRATIS 16 - 29 de Setembro. Ver detalhes"
      let freteGratis = false, prazo = "";
      const mEnt = entrega.match(/(?:entrega|frete)\s+gr[aá]tis([^.]*)/i);
      if (mEnt) {
        freteGratis = true;
        // A Amazon as vezes escreve "Entrega GRATIS <data> no seu primeiro pedido".
        // Nesse caso o frete gratis e CONDICIONAL - precisa ficar explicito, senao engana
        // quem ja e cliente. Guardamos so a data e marcamos a condicao.
        const soPrimeiroPedido = /primeiro pedido/i.test(entrega);
        let quando = mEnt[1]
          .replace(/\s*no seu primeiro pedido.*/i, "")
          .replace(/\s*ver detalhes.*/i, "")
          .replace(/\s+/g, " ")
          .trim();
        if (quando.length > 45) quando = quando.slice(0, 45).replace(/\s+\S*$/, "");  // corta em palavra inteira
        prazo = "Entrega GRÁTIS" + (quando ? " " + quando : "") + (soPrimeiroPedido ? " (no 1º pedido)" : "");
      }

      // Estoque baixo (gera urgencia real). Ex.: "Somente 1 em estoque."
      let estoqueBaixo = "";
      const mEst = estoque.match(/somente\s+(\d+)\s+em estoque/i);
      if (mEst) estoqueBaixo = `Somente ${mEst[1]} em estoque`;

      // Parcelamento. Ex.: "Em ate 13x de R$ 42,82 sem juros"
      let parcelas = "";
      const mPar = (preco + " " + centro).match(/em at[ée]\s+(\d{1,2})x\s+de\s+(R\$\s?[\d.,]+)\s+sem juros/i);
      if (mPar) parcelas = `Em até ${mPar[1]}x de ${mPar[2]} sem juros`;

      // Cupom no checkout. Ex.: "economize mais 20% na finalizacao do pedido"
      let cupom = 0;
      const mCup = (promo + " " + centro).match(/economize\s+(?:mais\s+)?(\d{1,2})\s*%/i);
      if (mCup) cupom = parseInt(mCup[1], 10);

      // Produto importado com taxas ja pagas
      const taxasIncluidas = /taxas de importa[çc][ãa]o j[áa] inclu[íi]das/i.test(centro);

      return { paginaOk: true, freteGratis, prazo, estoqueBaixo, parcelas, cupom, taxasIncluidas };
    });

    return info.paginaOk ? info : null;
  } catch {
    return null;   // qualquer falha: nao afirma nada
  } finally {
    if (page) { try { await page.close(); } catch { /* ignora */ } }
  }
}

// Monta as linhas extras (so o que foi REALMENTE lido na pagina) e insere
// antes da linha do link, mantendo o link por ultimo.
function montarLegenda(captionBase, extra) {
  if (!extra) return captionBase;
  const NL = String.fromCharCode(10);
  const linhas = [];
  if (extra.freteGratis) linhas.push("\u{1F69A} " + (extra.prazo || "Entrega GRÁTIS"));
  else linhas.push("\u{1F69A} Mais frete");
  if (extra.estoqueBaixo)  linhas.push("\u{1F4E6} " + extra.estoqueBaixo);
  if (extra.cupom > 0)     linhas.push("\u{1F3AB} Economize mais " + extra.cupom + "% na finalização");
  if (extra.parcelas)      linhas.push("\u{1F4B3} " + extra.parcelas);
  if (extra.taxasIncluidas) linhas.push("\u{1F30E} Taxas de importação já incluídas");

  const partes = captionBase.split(NL);
  const iLink = partes.findIndex(l => l.includes("\u{1F517}"));
  if (iLink === -1) return captionBase + NL + linhas.join(NL);
  partes.splice(iLink, 0, ...linhas);   // extras antes do link
  return partes.join(NL);
}

async function sendOffer(client) {
  try {
    const offer = await fetchOffer();
    if (!offer) { console.log("Sem resposta do app."); return; }
    if (offer.autoSend === false) { console.log("Envio automatico desligado no painel."); return; }
    if (!offer.target) { console.log("Configure o grupo/numero no painel."); return; }
    if (!offer.offers || !offer.offers.length) {
      console.log(`[${new Date().toLocaleString("pt-BR")}] Nenhuma oferta nova (as atuais ja foram enviadas).`);
      lastSent = Date.now();   // espera o proximo ciclo antes de tentar de novo
      return;
    }

    const chatId = await resolverChatId(client, offer.target);
    const enviados = [], titulos = [], descontos = [], detalhes = [];

    // Uma mensagem por jogo: foto + legenda. Pausa entre elas pra nao parecer spam.
    for (const item of offer.offers) {
      try {
        // Confere na pagina real antes de enviar (frete/cupom verdadeiros)
        const extra = await verificarNaPagina(client, item.asin);
        const legenda = montarLegenda(item.caption, extra);
        if (extra) {
          console.log(`  verificado: frete=${extra.freteGratis} cupom=${extra.cupom}% estoque="${extra.estoqueBaixo}"`);
        } else {
          console.log("  (nao consegui ler a pagina - envio sem infos extras)");
        }

        if (item.image) {
          const media = await MessageMedia.fromUrl(item.image, { unsafeMime: true });
          await client.sendMessage(chatId, media, { caption: legenda });
        } else {
          await client.sendMessage(chatId, legenda);
        }
        enviados.push(item.asin);
        titulos.push(item.title);
        descontos.push(item.discount || 0);
        detalhes.push({ price: item.price, oldPrice: item.oldPrice, image: item.image });
        console.log(`  enviado: ${item.title.slice(0, 55)}`);
        await new Promise(r => setTimeout(r, 4000));
      } catch (e) {
        console.log(`  falhou (${item.title.slice(0, 35)}): ${e.message}`);
      }
    }

    if (enviados.length) {
      await marcarEnviados(enviados, titulos, descontos, detalhes);
      lastSent = Date.now();
      console.log(`[${new Date().toLocaleString("pt-BR")}] ${enviados.length} ofertas enviadas para ${offer.target}`);
    }
  } catch (e) {
    console.log("Erro ao enviar:", e.message);
  }
}

async function loop(client) {
  try {
    await sendHeartbeat();
    const cfg = await fetchSendConfig().catch(() => null);
    const freq = cfg && cfg.frequencyMinutes ? cfg.frequencyMinutes : 60;
    const elapsedMin = (Date.now() - lastSent) / 60000;
    if (ready && elapsedMin >= freq) {
      await sendOffer(client);
    }
  } catch { /* ignora */ }
  setTimeout(() => loop(client), 60000);
}

console.log("=== TABULEIRO360 - Enviador de WhatsApp (whatsapp-web.js) ===");
console.log("App:", APP_URL);

const navegador = acharNavegador();
if (navegador) {
  console.log("[WhatsApp] Usando navegador:", navegador);
} else {
  console.log("[WhatsApp] AVISO: nenhum navegador encontrado. Instale o Google Chrome (https://www.google.com/chrome) e rode de novo.");
}

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, "data", ".wwebjs_auth") }),
  puppeteer: {
    headless: true,
    executablePath: navegador, // usa um navegador já instalado (não baixa)
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  },
  // Corrige "Execution context was destroyed": fixa uma versao conhecida do WhatsApp Web,
  // senao a lib tenta injetar numa versao nova que ela ainda nao suporta.
  webVersionCache: {
    type: "remote",
    remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1027913442.html"
  }
});

client.on("qr", (qr) => {
  console.log("\n📱 ESCANEIE O QR CODE ABAIXO COM SEU WHATSAPP:");
  console.log("   (WhatsApp > Aparelhos conectados > Conectar aparelho)\n");
  qrcode.generate(qr, { small: true });
});

client.on("loading_screen", (pct, msg) => console.log(`[WhatsApp] Carregando ${pct}% ${msg || ""}`));
client.on("change_state", (st) => console.log("[WhatsApp] Estado:", st));
client.on("authenticated", () => console.log("[WhatsApp] Autenticado."));

// Se em 90s nao apareceu QR nem conectou, avisa o que fazer (evita ficar no escuro)
const watchdog = setTimeout(() => {
  if (!ready) {
    console.log("[WhatsApp] AINDA SEM RESPOSTA apos 90s. O que tentar:");
    console.log("  1) Apague a pasta data\.wwebjs_auth e rode de novo (sessao corrompida)");
    console.log("  2) Instale o Google Chrome no servidor");
    console.log("  3) Confira se o servidor acessa web.whatsapp.com");
  }
}, 90000);

client.on("auth_failure", (m) => console.error("[WhatsApp] Falha de autenticação:", m));

client.on("ready", () => {
  clearTimeout(watchdog);
  ready = true;
  console.log("\n✅ WHATSAPP CONECTADO! O envio automático está ativo.");
  console.log("   Deixe esta janela ABERTA. Ela envia as ofertas sozinha no intervalo configurado.\n");
  setTimeout(() => sendOffer(client), 5000); // envia uma vez ao conectar
});

client.on("disconnected", (r) => {
  ready = false;
  console.error("[WhatsApp] Desconectado:", r, "- reiniciando...");
  setTimeout(() => client.initialize().catch((e) => console.error(e.message)), 5000);
});

// Fechar a janela no X mata o Node mas deixa o Chrome vivo segurando a pasta da
// sessao. Na proxima vez dava "The browser is already running". Aqui: se der esse
// erro, apaga o cadeado (Singleton*) e tenta de novo. A sessao NAO se perde.
function limparCadeado() {
  const dir = path.join(__dirname, "data", ".wwebjs_auth", "session");
  let apagou = 0;
  try {
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith("Singleton")) {
        try { fs.rmSync(path.join(dir, f), { force: true, recursive: true }); apagou++; } catch { /* ignora */ }
      }
    }
  } catch { /* pasta ainda nao existe */ }
  return apagou;
}

async function iniciar() {
  try {
    await client.initialize();
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    if (/already running/i.test(msg)) {
      console.log("[WhatsApp] Sobrou um navegador da execucao anterior. Limpando o cadeado...");
      const n = limparCadeado();
      console.log(`[WhatsApp] ${n} arquivo(s) de cadeado removido(s). Tentando de novo...`);
      try {
        await client.initialize();
        return;
      } catch (e2) {
        console.error("Erro ao iniciar:", e2.message);
        console.error("  -> Feche as janelas do INICIAR.bat e encerre o chrome.exe do TABULEIRO360 no Gerenciador de Tarefas.");
        return;
      }
    }
    console.error("Erro ao iniciar:", msg);
  }
}

// Ctrl+C / fechar a janela: encerra o navegador junto (evita o orfao de novo)
let encerrando = false;
async function encerrar() {
  if (encerrando) return;
  encerrando = true;
  console.log("\nEncerrando... fechando o navegador.");
  try { await client.destroy(); } catch { /* ignora */ }
  process.exit(0);
}
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
process.on("SIGHUP", encerrar);

iniciar();
loop(client);
