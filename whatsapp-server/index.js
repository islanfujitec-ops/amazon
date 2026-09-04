// TABULEIRO360 - Enviador automático de WhatsApp (whatsapp-web.js)
// Usa o WhatsApp Web real num navegador (igual ao Radar Petronect que funciona),
// o que resolve o erro "not-acceptable"/LID do Baileys. Sem Docker.
// Conecta por QR, e no intervalo configurado busca as ofertas no app e envia no grupo/número.

import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import qrcode from "qrcode-terminal";
import axios from "axios";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===== CONFIG =====
const APP_URL = process.env.APP_URL || "https://tabuleiro360.vercel.app";
const PULL_KEY = process.env.WA_PULL_KEY || "";
// ==================

let ready = false;
let lastSent = 0;

async function fetchOffer() {
  const url = `${APP_URL}/api/pending-message${PULL_KEY ? "?key=" + encodeURIComponent(PULL_KEY) : ""}`;
  const { data } = await axios.get(url, { timeout: 20000 });
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

async function sendOffer(client) {
  try {
    const offer = await fetchOffer();
    if (!offer || !offer.message) { console.log("⚠️ Sem mensagem para enviar."); return; }
    if (offer.autoSend === false) { console.log("⏸️ Envio automático desligado no painel."); return; }
    if (!offer.target) { console.log("⚠️ Configure o grupo/número no painel (aba Configurações)."); return; }

    const chatId = await resolverChatId(client, offer.target);
    await client.sendMessage(chatId, offer.message);
    lastSent = Date.now();
    console.log(`✅ [${new Date().toLocaleString("pt-BR")}] Enviado (${offer.count} ofertas) para ${offer.target}`);
  } catch (e) {
    console.log("❌ Erro ao enviar:", e.message);
  }
}

async function loop(client) {
  try {
    await sendHeartbeat();
    const offer = await fetchOffer().catch(() => null);
    const freq = offer && offer.frequencyMinutes ? offer.frequencyMinutes : 60;
    const elapsedMin = (Date.now() - lastSent) / 60000;
    if (ready && elapsedMin >= freq) {
      await sendOffer(client);
    }
  } catch { /* ignora */ }
  setTimeout(() => loop(client), 60000);
}

console.log("=== TABULEIRO360 - Enviador de WhatsApp (whatsapp-web.js) ===");
console.log("App:", APP_URL);

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, "data", ".wwebjs_auth") }),
  puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] }
});

client.on("qr", (qr) => {
  console.log("\n📱 ESCANEIE O QR CODE ABAIXO COM SEU WHATSAPP:");
  console.log("   (WhatsApp > Aparelhos conectados > Conectar aparelho)\n");
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => console.log("[WhatsApp] Autenticado."));
client.on("auth_failure", (m) => console.error("[WhatsApp] Falha de autenticação:", m));

client.on("ready", () => {
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

client.initialize().catch((e) => console.error("Erro ao iniciar:", e.message));
loop(client);
