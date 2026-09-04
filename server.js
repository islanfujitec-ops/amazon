const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { searchAmazonProducts, getProductByASIN, debugApi } = require('./lib/amazonApi');
const { buildSearchUrl, buildOfferUrl } = require('./lib/amazonLinks');
const { sendViaEvolution, getEvolutionStatus, isEvolutionConfigured } = require('./lib/whatsappSender');
const { fetchComparaJogos, fetchPriceReductions } = require('./lib/comparaJogos');

const app = express();
const PORT = process.env.PORT || 3000;

// URL base do app (pra montar links de rastreio de clique)
const BASE_URL = process.env.BASE_URL || 'https://tabuleiro360.vercel.app';
function trackUrl(target, label) {
  return `${BASE_URL}/r?to=${encodeURIComponent(target)}&label=${encodeURIComponent(label)}`;
}

// Login vem das variáveis de ambiente (seguro, fora do GitHub). Fallback só p/ dev local.
const DEFAULT_USERNAME = process.env.AUTH_USER || 'admin';
const DEFAULT_PASSWORD = process.env.AUTH_PASS || 'admin';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Middleware de autenticação
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !isValidToken(token)) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  next();
};

// Gerar token JWT simples
function generateToken(username) {
  const payload = {
    username,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Validar token
function isValidToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

// Rota raiz - servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Adicionar marca
app.post('/api/add-brand', async (req, res) => {
  const config = await loadConfig();
  const { brand } = req.body;

  if (brand && !config.brands.includes(brand)) {
    config.brands.push(brand);
    await saveConfig(config);
    res.json({ success: true, brands: config.brands });
  } else {
    res.json({ success: false, error: 'Marca inválida ou já existe' });
  }
});

// Remover marca
app.post('/api/remove-brand', async (req, res) => {
  const config = await loadConfig();
  const { brand } = req.body;

  config.brands = config.brands.filter(b => b !== brand);
  await saveConfig(config);
  res.json({ success: true, brands: config.brands });
});

// Adicionar keyword
app.post('/api/add-keyword', async (req, res) => {
  const config = await loadConfig();
  const { keyword } = req.body;

  if (keyword && !config.keywords.includes(keyword)) {
    config.keywords.push(keyword);
    await saveConfig(config);
    res.json({ success: true, keywords: config.keywords });
  } else {
    res.json({ success: false, error: 'Keyword inválida ou já existe' });
  }
});

// Remover keyword
app.post('/api/remove-keyword', async (req, res) => {
  const config = await loadConfig();
  const { keyword } = req.body;

  config.keywords = config.keywords.filter(k => k !== keyword);
  await saveConfig(config);
  res.json({ success: true, keywords: config.keywords });
});

console.log('âœ… TABULEIRO360 - API integrada com Amazon Associados');

// Arquivo de dados (fallback local - só funciona em desenvolvimento, Vercel não persiste)
const dataFile = path.join(__dirname, 'config.json');

// Supabase - persistência real (funciona no Vercel)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

function getDefaultConfig() {
  return {
    amazonEmail: '',
    amazonPassword: '',
    whatsappNumber: '',
    frequency: 60,
    keywords: [
      'Brinquedos e jogos',
      'Jogos e acessórios',
      'Jogos de tabuleiro',
      'Jogos de cartas Colecionáveis',
      'Cartas colecionáveis'
    ],
    brands: [
      'Asmodee',
      'Galápagos',
      'Mepple BR',
      'Copag',
      'Devir',
      'GROK',
      'CNMON',
      'Jelly monster',
      'Rio grande Games',
      'Caos tome games',
      'Across the board',
      'RAVENSBURG',
      'MARVEL',
      'AWAKEN REALMS',
      'STONEMAIER GAMES',
      'MANDALA',
      'Gmt games',
      'GAMEGENIC',
      'Paper games',
      'Martel',
      'POKÉMON',
      'LORCANA',
      'Chip theory games',
      'Eagle Games',
      'Fantasy Flight Games',
      'WISE WIZARD GAMES',
      'LA BOITE DE JEU'
    ],
    products: [],
    priceHistory: [],
    sendAlerts: false
  };
}

// Carregar configurações
async function loadConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Sem Supabase configurado - usa arquivo local (não persiste no Vercel)
    if (fs.existsSync(dataFile)) {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
    return getDefaultConfig();
  }

  try {
    const { data } = await axios.get(
      `${SUPABASE_URL}/rest/v1/tabuleiro360_config?id=eq.1&select=data`,
      { headers: supabaseHeaders }
    );

    if (data && data[0] && data[0].data) {
      return data[0].data;
    }

    // Linha ainda não existe - criar com config padrão
    const defaultConfig = getDefaultConfig();
    await saveConfig(defaultConfig);
    return defaultConfig;
  } catch (error) {
    console.error('Erro ao carregar config do Supabase:', error.message);
    return getDefaultConfig();
  }
}

// Salvar configurações
async function saveConfig(config) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    fs.writeFileSync(dataFile, JSON.stringify(config, null, 2));
    return;
  }

  try {
    await axios.post(
      `${SUPABASE_URL}/rest/v1/tabuleiro360_config`,
      { id: 1, data: config },
      { headers: { ...supabaseHeaders, Prefer: 'resolution=merge-duplicates' } }
    );
  } catch (error) {
    console.error('Erro ao salvar config no Supabase:', error.message);
  }
}

// Scraper Amazon
async function searchAmazonBrazil(query) {
  try {
    const url = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    const results = [];

    $('[data-component-type="s-search-result"]').slice(0, 5).each((i, elem) => {
      try {
        const title = $(elem).find('h2 span').text() || '';
        const priceStr = $(elem).find('.a-price-whole').text() || '';
        const link = $(elem).find('h2 a').attr('href') || '';

        if (title && priceStr && link) {
          const price = parseFloat(priceStr.replace(/[^\d,]/g, '').replace(',', '.'));
          results.push({
            title: title.trim(),
            price: isNaN(price) ? 0 : price,
            link: `https://www.amazon.com.br${link}`,
            store: 'Amazon.com.br'
          });
        }
      } catch (e) {
        console.log('Erro ao fazer parse:', e.message);
      }
    });

    return results;
  } catch (error) {
    console.error('Erro ao scraper Amazon:', error.message);
    return [];
  }
}

// Enviar WhatsApp
async function sendWhatsAppAlert(phoneNumber, message) {
  try {
    // IntegraÃ§Ã£o com sua API WhatsApp
    // Exemplo usando Evolution API
    console.log(`ðŸ“± [Simulado] WhatsApp para ${phoneNumber}:`);
    console.log(message);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error.message);
    return { success: false };
  }
}

// Monitorar preÃ§os
async function monitorPrices() {
  const config = await loadConfig();

  if (!config.brands.length && !config.keywords.length) {
    console.log('âŒ Nenhuma marca ou palavra-chave configurada');
    return;
  }

  console.log(`\nðŸ” Buscando preÃ§os... (${new Date().toLocaleTimeString()})`);

  // Amazon bloqueia scraping automatizado com Akamai bot-check (sempre retorna challenge, nunca resultado real).
  // ponytail: pulamos a tentativa ao vivo (32 chamadas sequenciais lentas e inúteis, risco de timeout na Vercel)
  // e usamos direto o banco de produtos curado. Upgrade: trocar por searchAmazonProducts() (Creators API)
  // quando a conta ficar elegível (10 vendas/30 dias).
  // Para cada MARCA e KEYWORD que o usuário configurou, gera um link de afiliado que abre
  // as ofertas reais daquela marca na Amazon ordenadas pelo menor preço (melhor valor primeiro).
  // O cliente clica, vê preços reais e a compra rende comissão pela tag do usuário.
  // Mostrar o preço exato ANTES do clique exige a Creators API (elegível após 10 vendas/30 dias).
  const items = [];
  for (const brand of config.brands) {
    items.push({ title: brand, type: 'marca', price: 'Ver ofertas', store: 'Amazon.com.br', affiliate_url: buildOfferUrl(brand) });
  }
  for (const kw of config.keywords) {
    items.push({ title: kw, type: 'categoria', price: 'Ver ofertas', store: 'Amazon.com.br', affiliate_url: buildOfferUrl(kw) });
  }
  config.products = items;

  await saveConfig(config);
  console.log(`Ofertas geradas: ${items.length} (marcas + categorias)`);

  return items;
}

// 🔐 LOGIN
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
    const token = generateToken(username);
    res.json({
      success: true,
      token,
      message: 'Login realizado com sucesso!'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Usuário ou senha incorretos'
    });
  }
});

// Logout (opcional)
app.post('/api/logout', (req, res) => {
  res.json({ success: true, message: 'Logout realizado' });
});

// APIs
app.get('/api/config', async (req, res) => {
  res.json(await loadConfig());
});

app.post('/api/config', async (req, res) => {
  const config = await loadConfig();
  Object.assign(config, req.body);
  await saveConfig(config);
  res.json({ success: true, config });
});

app.get('/api/monitor', async (req, res) => {
  try {
    const items = await monitorPrices();
    res.json({ success: true, results: items || [] });
  } catch (error) {
    console.error('Erro no monitor:', error.message);
    res.json({ success: false, error: error.message, results: [] });
  }
});

// 📊 RASTREIO DE CLIQUES: conta o clique e redireciona pra Amazon.
// Link enviado ao cliente = /r?to=<url amazon>&label=<marca>
app.get('/r', async (req, res) => {
  const to = req.query.to || '';
  const label = req.query.label || 'sem-rotulo';

  // Segurança: só redireciona pra Amazon (evita open-redirect)
  const isAmazon = /^https:\/\/(www\.)?amazon\.com\.br\//.test(to);
  if (!isAmazon) {
    return res.status(400).send('Link inválido');
  }

  try {
    const config = await loadConfig();
    config.clicks = config.clicks || {};
    config.clicks[label] = (config.clicks[label] || 0) + 1;
    config.totalClicks = (config.totalClicks || 0) + 1;
    await saveConfig(config);
  } catch (e) {
    console.error('Erro ao registrar clique:', e.message);
  }

  res.redirect(302, to);
});

// 🎯 COMPARA JOGOS: melhores jogos/preços do site, já com SEU link de afiliado + rastreio
app.get('/api/compara-jogos', async (req, res) => {
  try {
    const config = await loadConfig();
    const limit = parseInt(req.query.limit) || 15;
    const tag = process.env.AMAZON_PARTNER_TAG || 'tabuleiro3605-20';

    // Mostra as PROMOÇÕES REAIS (reduções de preço), maiores descontos primeiro.
    // Aqui mostra todas pra você navegar; o filtro de desconto mínimo vale no envio do WhatsApp.
    let deals = await fetchPriceReductions();
    deals = deals.slice(0, limit).map(d => {
      const amazonUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(d.name)}&i=toys&tag=${tag}`;
      return {
        name: d.name,
        price: `R$ ${d.price.toFixed(2)}`,
        oldPrice: d.oldPrice ? `R$ ${d.oldPrice.toFixed(2)}` : null,
        discount: d.discount,
        thumbnail: d.thumbnail,
        affiliate_url: trackUrl(amazonUrl, d.name)
      };
    });

    res.json({ success: true, count: deals.length, games: deals });
  } catch (error) {
    res.json({ success: false, error: error.message, games: [] });
  }
});

// 🖥️ HEARTBEAT: o servidor Windows avisa que está ativo/conectado
app.post('/api/heartbeat', async (req, res) => {
  try {
    const config = await loadConfig();
    config.serverStatus = {
      online: true,
      whatsappConnected: req.body.whatsappConnected === true,
      lastSeen: Date.now(),
      lastSent: req.body.lastSent || config.serverStatus?.lastSent || null
    };
    await saveConfig(config);
    res.json({ ok: true });
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});

// Status do servidor Windows (o painel usa pra mostrar online/offline)
app.get('/api/server-status', async (req, res) => {
  try {
    const config = await loadConfig();
    const s = config.serverStatus || {};
    const online = s.lastSeen && (Date.now() - s.lastSeen < 3 * 60 * 1000); // ativo se visto nos últimos 3 min
    res.json({
      online: !!online,
      whatsappConnected: online ? !!s.whatsappConnected : false,
      lastSeen: s.lastSeen || null,
      lastSent: s.lastSent || null
    });
  } catch (error) {
    res.json({ online: false, error: error.message });
  }
});

// 📈 MÉTRICAS: cliques por marca (mais clicados primeiro)
app.get('/api/metrics', async (req, res) => {
  try {
    const config = await loadConfig();
    const clicks = config.clicks || {};
    const ranking = Object.entries(clicks)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    res.json({ totalClicks: config.totalClicks || 0, ranking });
  } catch (error) {
    res.json({ totalClicks: 0, ranking: [], error: error.message });
  }
});

app.get('/api/history', async (req, res) => {
  const config = await loadConfig();
  res.json(config.priceHistory.slice(-100));
});

app.get('/api/clear-history', async (req, res) => {
  const config = await loadConfig();
  config.priceHistory = [];
  await saveConfig(config);
  res.json({ success: true });
});

// ðŸŽ¯ ROTAS DA API AMAZON ASSOCIADOS

app.post('/api/amazon/search', async (req, res) => {
  try {
    const { keywords, limit } = req.body;

    if (!keywords) {
      return res.json({ success: false, error: 'Keywords obrigatÃ³rio' });
    }

    const results = await searchAmazonProducts(keywords, limit || 10);

    if (results.length === 0) {
      return res.json({
        success: false,
        error: 'Nenhum produto encontrado. Verifique as credenciais em .env.amazon',
        hint: 'Gere credenciais em: https://associados.amazon.com.br/'
      });
    }

    res.json({ success: true, results });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/amazon/product', async (req, res) => {
  try {
    const { asin } = req.body;

    if (!asin) {
      return res.json({ success: false, error: 'ASIN obrigatÃ³rio' });
    }

    const product = await getProductByASIN(asin);

    if (!product) {
      return res.json({ success: false, error: 'Produto nÃ£o encontrado' });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/whatsapp/status', async (req, res) => {
  try {
    const status = await getEvolutionStatus();
    res.json(status);
  } catch (error) {
    res.json({ configured: false, connected: false, error: error.message });
  }
});

app.get('/api/amazon/debug', async (req, res) => {
  try {
    const result = await debugApi(req.query.q || 'Catan');
    res.json(result);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/api/amazon/status', (req, res) => {
  const hasCredentials = process.env.AMAZON_CREDENTIAL_ID &&
                        process.env.AMAZON_CREDENTIAL_SECRET &&
                        process.env.AMAZON_PARTNER_TAG;

  res.json({
    success: true,
    credentials_configured: !!hasCredentials,
    partner_tag: process.env.AMAZON_PARTNER_TAG || 'nÃ£o configurado',
    marketplace: process.env.AMAZON_MARKETPLACE || 'BR'
  });
});

// ðŸŽ¯ MELHORES PREÃ‡OS - Endpoint para listar produtos com melhores preÃ§os
app.get('/api/best-prices', async (req, res) => {
  try {
    const config = await loadConfig();

    if (!config.products || config.products.length === 0) {
      return res.json({ bestPrices: [] });
    }

    // Ordenar por preÃ§o e pegar os melhores
    const bestPrices = config.products
      .sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const priceB = parseFloat(b.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        return priceA - priceB;
      })
      .slice(0, 10) // Top 10 melhores preÃ§os
      .map(p => ({
        ...p,
        affiliate_url: buildSearchUrl(p.title)
      }));

    res.json({ bestPrices });
  } catch (error) {
    res.json({ bestPrices: [], error: error.message });
  }
});

// Monta a mensagem do WhatsApp.
// IMPORTANTE (honestidade): o Compara Jogos é usado só como RADAR — ele indica quais
// jogos estão em promoção no mercado (lojas especializadas). Esses preços NÃO são da
// Amazon, então NÃO são exibidos na mensagem: mostrar preço de uma loja com link de
// outra seria enganoso. A mensagem leva o nome do jogo + link da Amazon com a sua tag
// (comissão garantida). Quando a Creators API for liberada, passamos a exibir o preço
// REAL da Amazon e o link direto do produto — o código já está preparado.
async function composeOffersMessage(config) {
  const minDiscount = config.minDiscount || 0;
  const limit = config.perBrand || 5;
  const tagFinal = config.partnerTag || process.env.AMAZON_PARTNER_TAG || 'tabuleiro3605-20';

  let deals = [];
  try {
    deals = await fetchPriceReductions();
  } catch (e) {
    console.error('Erro Compara Jogos:', e.message);
  }

  // Radar: jogos com queda de preço no mercado, filtrados pelo desconto mínimo
  const selected = deals.filter(d => d.discount >= minDiscount).slice(0, limit);

  let message = '🎲 *JOGOS EM DESTAQUE - TABULEIRO360*\n\n';
  message += `_${new Date().toLocaleString('pt-BR')}_\n\n`;
  message += 'Jogos com queda de preço no mercado. Confira na Amazon:\n\n';

  selected.forEach((d, i) => {
    // Busca escopada em Brinquedos e Jogos (i=toys) pra o jogo aparecer certeiro em 1º
    const amazonUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(d.name)}&i=toys&tag=${tagFinal}`;
    message += `*${i + 1}. ${d.name}*\n`;
    message += `🔗 ${trackUrl(amazonUrl, d.name)}\n\n`;
  });

  message += '_Preços e disponibilidade na Amazon 💸_';
  return { message, count: selected.length };
}

// 📤 O servidor Windows (script Node) busca aqui a mensagem pronta pra enviar no grupo.
// Protegido por chave (WA_PULL_KEY). Só conexão de SAÍDA — não expõe nada.
app.get('/api/pending-message', async (req, res) => {
  try {
    const key = process.env.WA_PULL_KEY;
    if (key && req.query.key !== key) {
      return res.status(401).json({ error: 'chave inválida' });
    }
    const config = await loadConfig();
    const { message, count } = await composeOffersMessage(config);
    res.json({
      target: config.whatsappNumber || '',
      message,
      count,
      frequencyMinutes: config.frequency || 60,
      autoSend: config.sendAlerts !== false
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// ðŸ“± ENVIAR WHATSAPP - Enviar melhores preÃ§os
app.post('/api/send-best-prices', async (req, res) => {
  try {
    const { whatsapp } = req.body;
    const config = await loadConfig();

    if (!whatsapp) {
      return res.json({ success: false, error: 'Configure um número ou grupo WhatsApp primeiro' });
    }

    // Usa a mesma lógica do envio automático: promoções reais filtradas por desconto/quantidade
    const { message, count } = await composeOffersMessage(config);
    if (count === 0) {
      return res.json({ success: false, error: 'Nenhuma oferta com o desconto mínimo configurado. Baixe o "Desconto mínimo" nas Configurações.' });
    }

    // Se a Evolution API estiver configurada, ENVIA sozinho (100% automático).
    // Senão, devolve o link wa.me (envio 1-clique) como fallback.
    if (isEvolutionConfigured()) {
      const sent = await sendViaEvolution(whatsapp, message);
      if (sent.success) {
        console.log(`Enviado automaticamente via Evolution para ${whatsapp} (${count} ofertas)`);
        return res.json({
          success: true,
          sent: true,
          message: `✅ Enviado automaticamente para ${whatsapp}!`,
          count,
          products: []
        });
      }
      console.log('Evolution falhou, usando fallback:', sent.error);
    }

    // Fallback (Evolution não ligado ainda)
    const isGroup = whatsapp.includes('chat.whatsapp.com');
    let whatsappLink;
    if (isGroup) {
      // wa.me não pré-preenche mensagem em grupo. Abre o grupo e devolve o texto pra copiar.
      whatsappLink = whatsapp;
    } else {
      const cleanNumber = whatsapp.replace(/[^\d]/g, '');
      whatsappLink = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    }

    console.log(`Mensagem de ofertas gerada para ${whatsapp} (${count} ofertas)`);

    res.json({
      success: true,
      sent: false,
      isGroup,
      messageText: message,
      message: isGroup ? 'Abra o grupo e cole a mensagem (copie abaixo)' : 'Clique no link abaixo para enviar no WhatsApp',
      whatsappLink: whatsappLink,
      count,
      products: []
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ðŸ“± ENVIAR PRODUTO INDIVIDUAL
app.post('/api/send-product-whatsapp', async (req, res) => {
  try {
    const { asin, whatsapp } = req.body;
    const config = await loadConfig();

    const product = config.products.find(p => p.asin === asin);
    if (!product) {
      return res.json({ success: false, error: 'Produto nÃ£o encontrado' });
    }

    const affiliate_url = buildSearchUrl(product.title);

    let message = '🎲 *OFERTA ESPECIAL - TABULEIRO360*\n\n';
    message += `*${product.title}*\n\n`;
    message += `💰 *${product.price}*\n\n`;
    message += `🔗 COMPRAR: ${affiliate_url}\n\n`;
    message += '_Aproveite! 🎯_';

    const whatsappLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

    console.log(`ðŸ“± Produto ${asin} - Mensagem gerada para ${whatsapp}`);

    res.json({
      success: true,
      message: 'Clique abaixo para enviar no WhatsApp',
      whatsappLink: whatsappLink
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`\nðŸš€ Price Monitor rodando em http://localhost:${PORT}`);
  console.log(`ðŸ“Š Dashboard: http://localhost:${PORT}\n`);

  // Carregar config
  const config = await loadConfig();

  // Agendar monitoramento
  if (config.frequency > 0) {
    const cronExpression = `*/${config.frequency} * * * *`;
    console.log(`â±ï¸ Monitoramento agendado a cada ${config.frequency} minuto(s)`);

    cron.schedule(cronExpression, () => {
      monitorPrices();
    });
  }
});


// Trigger redeploy: Supabase env vars configured 2026-08-31 13:52

// Redeploy: new Supabase project connected 2026-08-31 14:12

// Redeploy: credenciais conta nova Tabuleiro360 2026-09-03 22:20
