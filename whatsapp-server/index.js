// TABULEIRO360 - Enviador automático de WhatsApp (roda no Windows Server, SEM Docker)
// Conecta seu WhatsApp por QR Code e, no intervalo configurado, busca as ofertas
// no app (Vercel) e envia no seu grupo. Só faz conexão de SAÍDA — não precisa abrir porta.

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const pino = require('pino');

// ===== CONFIG (edite só se precisar) =====
const APP_URL = process.env.APP_URL || 'https://tabuleiro360.vercel.app';
const PULL_KEY = process.env.WA_PULL_KEY || ''; // se você setar WA_PULL_KEY no Vercel, coloque a mesma aqui
// ==========================================

const log = pino({ level: 'silent' });
let sock;
let ready = false;
let lastSent = 0;

async function fetchOffer() {
  const url = `${APP_URL}/api/pending-message${PULL_KEY ? '?key=' + encodeURIComponent(PULL_KEY) : ''}`;
  const { data } = await axios.get(url, { timeout: 20000 });
  return data;
}

// Resolve o destino (link de grupo -> JID, número -> JID) e envia
async function sendOffer() {
  try {
    const offer = await fetchOffer();
    if (!offer || !offer.message) { console.log('⚠️ Sem mensagem para enviar.'); return; }
    if (offer.autoSend === false) { console.log('⏸️ Envio automático desligado no painel.'); return; }
    if (!offer.target) { console.log('⚠️ Configure o grupo/número no painel (aba Configurações).'); return; }

    let jid;
    const target = offer.target.trim();
    if (target.includes('chat.whatsapp.com')) {
      const code = target.split('chat.whatsapp.com/')[1].split(/[?/]/)[0];
      try {
        const info = await sock.groupGetInviteInfo(code);
        jid = info.id;
      } catch {
        const res = await sock.groupAcceptInvite(code); // entra no grupo se ainda não estiver
        jid = res;
      }
    } else if (target.includes('@g.us') || target.includes('@s.whatsapp.net')) {
      jid = target;
    } else {
      jid = target.replace(/[^\d]/g, '') + '@s.whatsapp.net';
    }

    await sock.sendMessage(jid, { text: offer.message });
    lastSent = Date.now();
    console.log(`✅ [${new Date().toLocaleString('pt-BR')}] Enviado (${offer.count} ofertas) para ${target}`);
  } catch (e) {
    console.log('❌ Erro ao enviar:', e.response?.data || e.message);
  }
}

async function sendHeartbeat() {
  try {
    await axios.post(`${APP_URL}/api/heartbeat${PULL_KEY ? '?key=' + encodeURIComponent(PULL_KEY) : ''}`,
      { whatsappConnected: ready, lastSent: lastSent || null },
      { timeout: 12000 });
  } catch {}
}

async function loop() {
  try {
    await sendHeartbeat(); // avisa o painel que está vivo
    const offer = await fetchOffer().catch(() => null);
    const freq = (offer && offer.frequencyMinutes) ? offer.frequencyMinutes : 60;
    const elapsedMin = (Date.now() - lastSent) / 60000;
    if (ready && elapsedMin >= freq) {
      await sendOffer();
    }
  } catch {}
  setTimeout(loop, 60000); // checa a cada 1 minuto (heartbeat + se já passou o intervalo)
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('sessao_whatsapp');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({ version, auth: state, logger: log, printQRInTerminal: false });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      console.log('\n📱 ESCANEIE O QR CODE ABAIXO COM SEU WHATSAPP:\n');
      console.log('   (WhatsApp > Aparelhos conectados > Conectar aparelho)\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      ready = true;
      console.log('\n✅ WHATSAPP CONECTADO! O envio automático está ativo.');
      console.log('   Deixe esta janela ABERTA. Ela envia as ofertas sozinha no intervalo configurado.\n');
      // envia uma vez logo ao conectar
      setTimeout(sendOffer, 5000);
    }
    if (connection === 'close') {
      ready = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log('❌ Sessão encerrada. Apague a pasta "sessao_whatsapp" e rode de novo para reconectar.');
      } else {
        console.log('🔄 Conexão caiu, reconectando...');
        start();
      }
    }
  });
}

console.log('=== TABULEIRO360 - Enviador de WhatsApp ===');
console.log('App:', APP_URL);
start();
loop();
