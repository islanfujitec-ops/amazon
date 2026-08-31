const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { searchAmazonProducts, getProductByASIN } = require('./lib/amazonApi');
const { getMockProducts, buildSearchUrl, buildOfferUrl } = require('./lib/mockProducts');

const app = express();
const PORT = process.env.PORT || 3000;

// Credenciais padrão (pode mudar depois)
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin';
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

// ðŸ“± ENVIAR WHATSAPP - Enviar melhores preÃ§os
app.post('/api/send-best-prices', async (req, res) => {
  try {
    const { whatsapp } = req.body;
    const config = await loadConfig();

    if (!whatsapp) {
      return res.json({ success: false, error: 'Configure um número ou grupo WhatsApp primeiro' });
    }

    // Garante que os itens (marcas + categorias) estejam gerados
    let items = config.products;
    if (!items || items.length === 0) {
      items = await monitorPrices();
    }

    // Limite opcional; por padrão envia todas as marcas/categorias configuradas
    const limit = parseInt(req.body.limit) || items.length;
    const selected = items.slice(0, limit).map(p => ({
      title: p.title,
      type: p.type || 'marca',
      affiliate_url: buildOfferUrl(p.title)
    }));

    let message = '🎲 *MELHORES OFERTAS - TABULEIRO360*\n\n';
    message += `_Atualizado em ${new Date().toLocaleString('pt-BR')}_\n\n`;
    message += 'Clique e veja as ofertas com o melhor preço:\n\n';

    selected.forEach((item, index) => {
      message += `*${index + 1}. ${item.title}*\n`;
      message += `🔗 ${item.affiliate_url}\n\n`;
    });

    message += '_Ofertas Amazon atualizadas — aproveite! 💸_';

    // Gera link do WhatsApp para o número informado
    const cleanNumber = whatsapp.replace(/[^\d]/g, '');
    const whatsappLink = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    console.log(`Mensagem de ofertas gerada para ${whatsapp} (${selected.length} itens)`);

    res.json({
      success: true,
      message: 'Clique no link abaixo para enviar no WhatsApp',
      whatsappLink: whatsappLink,
      count: selected.length,
      products: selected
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
