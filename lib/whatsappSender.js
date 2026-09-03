const axios = require('axios');

// Envio via Evolution API (self-host). Configurar no Vercel:
//   EVOLUTION_API_URL   = https://sua-instancia.up.railway.app
//   EVOLUTION_API_KEY   = sua_api_key
//   EVOLUTION_INSTANCE  = nome_da_instancia (ex: tabuleiro360)
// Enquanto não estiver configurado, o app continua gerando o link wa.me (envio 1-clique).

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'tabuleiro360';

function isEvolutionConfigured() {
  return !!(EVOLUTION_API_URL && EVOLUTION_API_KEY);
}

// Resolve um link de convite (chat.whatsapp.com/XXXX) para o ID do grupo (xxxx@g.us).
// A conta conectada precisa estar dentro do grupo.
async function resolveGroupId(inviteLink) {
  const code = inviteLink.split('chat.whatsapp.com/')[1]?.split(/[?/]/)[0];
  if (!code) return null;
  try {
    const resp = await axios.get(
      `${EVOLUTION_API_URL}/group/inviteInfo/${EVOLUTION_INSTANCE}`,
      { params: { inviteCode: code }, headers: { apikey: EVOLUTION_API_KEY }, timeout: 12000 }
    );
    return resp.data?.id || resp.data?.groupJid || null;
  } catch {
    return null;
  }
}

// Envia uma mensagem para um número (55DDNumero), grupo (id@g.us) ou link de convite de grupo
async function sendViaEvolution(target, message) {
  if (!isEvolutionConfigured()) {
    return { success: false, error: 'Evolution API não configurada' };
  }

  let number;
  if (target.includes('chat.whatsapp.com')) {
    number = await resolveGroupId(target);
    if (!number) {
      return { success: false, error: 'Não consegui resolver o grupo. A conta que envia está dentro do grupo?' };
    }
  } else if (target.includes('@g.us')) {
    number = target;
  } else {
    number = target.replace(/[^\d]/g, '');
  }

  try {
    const resp = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      { number, text: message },
      {
        headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
        timeout: 15000
      }
    );
    return { success: true, data: resp.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

// Status da conexão da instância (para o dashboard mostrar se o WhatsApp está conectado)
async function getEvolutionStatus() {
  if (!isEvolutionConfigured()) {
    return { configured: false, connected: false };
  }
  try {
    const resp = await axios.get(
      `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`,
      { headers: { apikey: EVOLUTION_API_KEY }, timeout: 10000 }
    );
    const state = resp.data?.instance?.state || resp.data?.state;
    return { configured: true, connected: state === 'open', state };
  } catch (error) {
    return { configured: true, connected: false, error: error.response?.data || error.message };
  }
}

module.exports = { sendViaEvolution, getEvolutionStatus, isEvolutionConfigured };
