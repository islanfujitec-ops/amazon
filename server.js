const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { searchAmazonProducts, getProductByASIN } = require('./lib/amazonApi');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

console.log('✅ TABULEIRO360 - API integrada com Amazon Associados');

// Arquivo de dados
const dataFile = path.join(__dirname, 'config.json');

// Carregar configurações
function loadConfig() {
  if (fs.existsSync(dataFile)) {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  }
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

// Salvar configurações
function saveConfig(config) {
  fs.writeFileSync(dataFile, JSON.stringify(config, null, 2));
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
    // Integração com sua API WhatsApp
    // Exemplo usando Evolution API
    console.log(`📱 [Simulado] WhatsApp para ${phoneNumber}:`);
    console.log(message);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error.message);
    return { success: false };
  }
}

// Monitorar preços
async function monitorPrices() {
  const config = loadConfig();

  if (!config.brands.length && !config.keywords.length) {
    console.log('❌ Nenhuma marca ou palavra-chave configurada');
    return;
  }

  console.log(`\n🔍 Buscando preços... (${new Date().toLocaleTimeString()})`);

  const allResults = [];
  const searchTerms = [...config.brands, ...config.keywords];

  for (const term of searchTerms) {
    const results = await searchAmazonBrazil(term);
    allResults.push(...results);
    console.log(`✅ ${term}: ${results.length} produtos encontrados`);
  }

  // Remover duplicatas
  const uniqueResults = Array.from(
    new Map(allResults.map(item => [item.link, item])).values()
  );

  // Salvar histórico
  config.priceHistory.push(...uniqueResults.map(p => ({
    ...p,
    timestamp: new Date().toISOString()
  })));

  // Enviar alerta WhatsApp se configurado
  if (config.sendAlerts && config.whatsappNumber && uniqueResults.length > 0) {
    const topProducts = uniqueResults.slice(0, 3);
    let message = `🎲 *Produtos Encontrados*\n\n`;
    topProducts.forEach((p, i) => {
      message += `${i + 1}. *${p.title.substring(0, 50)}*\n`;
      message += `💰 R$ ${p.price.toFixed(2)}\n`;
      message += `🔗 ${p.link}\n\n`;
    });
    message += `Horário: ${new Date().toLocaleTimeString()}`;

    await sendWhatsAppAlert(config.whatsappNumber, message);
  }

  saveConfig(config);
  console.log(`✅ Monitoramento concluído: ${uniqueResults.length} produtos`);

  return uniqueResults;
}

// APIs
app.get('/api/config', (req, res) => {
  res.json(loadConfig());
});

app.post('/api/config', (req, res) => {
  const config = loadConfig();
  Object.assign(config, req.body);
  saveConfig(config);
  res.json({ success: true, config });
});

app.get('/api/monitor', async (req, res) => {
  const results = await monitorPrices();
  res.json({ success: true, results });
});

app.get('/api/history', (req, res) => {
  const config = loadConfig();
  res.json(config.priceHistory.slice(-100));
});

app.get('/api/clear-history', (req, res) => {
  const config = loadConfig();
  config.priceHistory = [];
  saveConfig(config);
  res.json({ success: true });
});

// 🎯 ROTAS DA API AMAZON ASSOCIADOS

app.post('/api/amazon/search', async (req, res) => {
  try {
    const { keywords, limit } = req.body;

    if (!keywords) {
      return res.json({ success: false, error: 'Keywords obrigatório' });
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
      return res.json({ success: false, error: 'ASIN obrigatório' });
    }

    const product = await getProductByASIN(asin);

    if (!product) {
      return res.json({ success: false, error: 'Produto não encontrado' });
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
    partner_tag: process.env.AMAZON_PARTNER_TAG || 'não configurado',
    marketplace: process.env.AMAZON_MARKETPLACE || 'BR'
  });
});

// 🎯 MELHORES PREÇOS - Endpoint para listar produtos com melhores preços
app.get('/api/best-prices', async (req, res) => {
  try {
    const config = loadConfig();

    if (!config.products || config.products.length === 0) {
      return res.json({ bestPrices: [] });
    }

    // Ordenar por preço e pegar os melhores
    const bestPrices = config.products
      .sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const priceB = parseFloat(b.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        return priceA - priceB;
      })
      .slice(0, 10) // Top 10 melhores preços
      .map(p => ({
        ...p,
        affiliate_url: `https://www.amazon.com.br/dp/${p.asin}?tag=${process.env.AMAZON_PARTNER_TAG || 'tainadadecio-20'}`
      }));

    res.json({ bestPrices });
  } catch (error) {
    res.json({ bestPrices: [], error: error.message });
  }
});

// 📱 ENVIAR WHATSAPP - Enviar melhores preços
app.post('/api/send-best-prices', async (req, res) => {
  try {
    const { whatsapp } = req.body;
    const config = loadConfig();

    if (!config.products || config.products.length === 0) {
      return res.json({ success: false, error: 'Nenhum produto monitorado' });
    }

    const bestPrices = config.products
      .sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const priceB = parseFloat(b.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        return priceA - priceB;
      })
      .slice(0, 5);

    let message = '🎲 *MELHORES PREÇOS ENCONTRADOS - TABULEIRO360*\n\n';
    message += `_Atualizados em ${new Date().toLocaleString('pt-BR')}_\n\n`;

    bestPrices.forEach((product, index) => {
      const affiliate_url = `https://www.amazon.com.br/dp/${product.asin}?tag=${process.env.AMAZON_PARTNER_TAG || 'tainadadecio-20'}`;
      message += `*${index + 1}. ${product.title}*\n`;
      message += `💰 *R$ ${product.price}*\n`;
      message += `🔗 ${affiliate_url}\n\n`;
    });

    message += '_Clique nos links para comprar com seu afiliado! 💸_';

    // Gerar link WhatsApp
    const whatsappLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

    console.log(`📱 Mensagem de promoção gerada para ${whatsapp}`);

    res.json({
      success: true,
      message: 'Clique no link abaixo para enviar no WhatsApp',
      whatsappLink: whatsappLink,
      count: bestPrices.length
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 📱 ENVIAR PRODUTO INDIVIDUAL
app.post('/api/send-product-whatsapp', async (req, res) => {
  try {
    const { asin, whatsapp } = req.body;
    const config = loadConfig();

    const product = config.products.find(p => p.asin === asin);
    if (!product) {
      return res.json({ success: false, error: 'Produto não encontrado' });
    }

    const affiliate_url = `https://www.amazon.com.br/dp/${product.asin}?tag=${process.env.AMAZON_PARTNER_TAG || 'tainadadecio-20'}`;

    let message = '🎲 *OFERTA ESPECIAL - TABULEIRO360*\n\n';
    message += `*${product.title}*\n\n`;
    message += `💰 *R$ ${product.price}*\n\n`;
    message += `🔗 COMPRAR: ${affiliate_url}\n\n`;
    message += '_Aproveite! 🎯_';

    const whatsappLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

    console.log(`📱 Produto ${asin} - Mensagem gerada para ${whatsapp}`);

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
app.listen(PORT, () => {
  console.log(`\n🚀 Price Monitor rodando em http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}\n`);

  // Carregar config
  const config = loadConfig();

  // Agendar monitoramento
  if (config.frequency > 0) {
    const cronExpression = `*/${config.frequency} * * * *`;
    console.log(`⏱️ Monitoramento agendado a cada ${config.frequency} minuto(s)`);

    cron.schedule(cronExpression, () => {
      monitorPrices();
    });
  }
});
