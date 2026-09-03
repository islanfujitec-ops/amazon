// Geradores de link REAIS da Amazon (busca + ofertas), com a tag de afiliado do servidor.
// Nada de produto inventado: só monta URLs de busca reais que abrem produtos de verdade.

function buildSearchUrl(title, tagOverride) {
  const tag = tagOverride || process.env.AMAZON_PARTNER_TAG || 'tainadadecio-20';
  return `https://www.amazon.com.br/s?k=${encodeURIComponent(title)}&tag=${tag}`;
}

// Ofertas de uma marca/categoria: busca ordenada pelo menor preço, dentro de Brinquedos e Jogos.
function buildOfferUrl(term, tagOverride) {
  const tag = tagOverride || process.env.AMAZON_PARTNER_TAG || 'tainadadecio-20';
  return `https://www.amazon.com.br/s?k=${encodeURIComponent(term)}&i=toys&s=price-asc-rank&tag=${tag}`;
}

module.exports = { buildSearchUrl, buildOfferUrl };
