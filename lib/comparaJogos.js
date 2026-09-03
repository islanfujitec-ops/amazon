const axios = require('axios');

// Lê o Compara Jogos (comparajogos.com.br) e extrai os jogos com menor preço + nota + foto.
// O site é Next.js: os dados vêm num JSON embutido (__NEXT_DATA__ / __APOLLO_STATE__),
// então não é scraping frágil de HTML — é leitura de dados estruturados.
// Usamos isso como "radar" de bons jogos/preços e geramos o link de afiliado do usuário.

async function fetchComparaJogos() {
  const { data: html } = await axios.get('https://www.comparajogos.com.br', {
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0' },
    timeout: 20000
  });

  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (!m) throw new Error('Não achei os dados do Compara Jogos');

  const json = JSON.parse(m[1]);
  const apollo = json?.props?.pageProps?.__APOLLO_STATE__ || {};

  const products = {};
  const prices = {};
  for (const [key, val] of Object.entries(apollo)) {
    if (!val || typeof val !== 'object') continue;
    if (val.__typename === 'product') products[val.id] = val;
    if (val.__typename === 'product_price') prices[val.id] = val;
  }

  const games = [];
  for (const [id, pr] of Object.entries(prices)) {
    const prod = products[pr.id] || products[id];
    if (!prod || !pr.min_price_new) continue;
    games.push({
      name: prod.name,
      price: pr.min_price_new,
      priceUsed: pr.min_price_used || null,
      rating: prod.bgg_rating ? Number(prod.bgg_rating).toFixed(1) : null,
      ranking: prod.bgg_ranking || null,
      storeCount: pr.new_count || 0,
      thumbnail: prod.thumbnail_url || '',
      slug: prod.slug || ''
    });
  }

  // menor preço primeiro
  games.sort((a, b) => a.price - b.price);
  return games;
}

module.exports = { fetchComparaJogos };
