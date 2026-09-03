// Banco de dados de produtos de teste
// Produtos reais da Amazon com nomes e preços aproximados

const MOCK_PRODUCTS = [
  {
    asin: 'B08X7VMBHJ',
    title: 'Catan - Jogo de Tabuleiro Clássico - Devir',
    price: 'R$ 119,90',
    image: 'https://m.media-amazon.com/images/I/61VjJKMkY+L._AC_SY200_.jpg',
    rating: '4.5',
    store: 'Amazon.com.br',
    brand: 'Devir'
  },
  {
    asin: 'B08XQSW3YZ',
    title: 'Ticket to Ride Brasil - Asmodee',
    price: 'R$ 189,90',
    image: 'https://m.media-amazon.com/images/I/71S7G+uXnYL._AC_SY200_.jpg',
    rating: '4.7',
    store: 'Amazon.com.br',
    brand: 'Asmodee'
  },
  {
    asin: 'B09KXYZ123',
    title: 'Azul - Jogo de Tabuleiro Estratégia',
    price: 'R$ 99,90',
    image: 'https://m.media-amazon.com/images/I/71Z1TZqKiLL._AC_SY200_.jpg',
    rating: '4.8',
    store: 'Amazon.com.br',
    brand: 'Galápagos'
  },
  {
    asin: 'B087MNQB2K',
    title: 'Splendor - Jogo de Estratégia e Negociação',
    price: 'R$ 149,90',
    image: 'https://m.media-amazon.com/images/I/61VZppjGsuL._AC_SY200_.jpg',
    rating: '4.6',
    store: 'Amazon.com.br',
    brand: 'Galápagos'
  },
  {
    asin: 'B08YQTP1KL',
    title: 'Pokémon TCG - Booster Box Escarlate e Violeta',
    price: 'R$ 299,90',
    image: 'https://m.media-amazon.com/images/I/71R7NjjE-wL._AC_SY200_.jpg',
    rating: '4.9',
    store: 'Amazon.com.br',
    brand: 'POKÉMON'
  },
  {
    asin: 'B089KQM2JX',
    title: 'Magic: The Gathering - Booster Bundle',
    price: 'R$ 449,90',
    image: 'https://m.media-amazon.com/images/I/71G9rG1C7tL._AC_SY200_.jpg',
    rating: '4.4',
    store: 'Amazon.com.br',
    brand: 'Copag'
  },
  {
    asin: 'B08VQXYZ99',
    title: 'Dice Throne - Jogo de Dados e Estratégia',
    price: 'R$ 189,90',
    image: 'https://m.media-amazon.com/images/I/81fvxXqJqUL._AC_SY200_.jpg',
    rating: '4.3',
    store: 'Amazon.com.br',
    brand: 'Mepple BR'
  },
  {
    asin: 'B08HQPYZ77',
    title: 'Wingspan - Jogo de Estratégia - Devir',
    price: 'R$ 349,90',
    image: 'https://m.media-amazon.com/images/I/81SJZbJ7c4L._AC_SY200_.jpg',
    rating: '4.9',
    store: 'Amazon.com.br',
    brand: 'Devir'
  },
  {
    asin: 'B087MNXY88',
    title: 'Gloomhaven - Aventura Épica de Tabuleiro',
    price: 'R$ 599,90',
    image: 'https://m.media-amazon.com/images/I/91fPvbUPq5L._AC_SY200_.jpg',
    rating: '5.0',
    store: 'Amazon.com.br',
    brand: 'Galápagos'
  },
  {
    asin: 'B089KQMXYZ',
    title: 'Lorcana TCG - Booster Box Disney',
    price: 'R$ 279,90',
    image: 'https://m.media-amazon.com/images/I/81ZvJqKJqJL._AC_SY200_.jpg',
    rating: '4.7',
    store: 'Amazon.com.br',
    brand: 'LORCANA'
  },
  {
    asin: 'B08XQSTYZ1',
    title: 'Everdell - Jogo de Construção e Estratégia',
    price: 'R$ 249,90',
    image: 'https://m.media-amazon.com/images/I/71ZkqKpq1qL._AC_SY200_.jpg',
    rating: '4.8',
    store: 'Amazon.com.br',
    brand: 'Asmodee'
  },
  {
    asin: 'B087MNPQST',
    title: 'Pandemic - Cooperativo Salve o Mundo',
    price: 'R$ 129,90',
    image: 'https://m.media-amazon.com/images/I/71QzVqpqKqL._AC_SY200_.jpg',
    rating: '4.5',
    store: 'Amazon.com.br',
    brand: 'Devir'
  },
  {
    asin: 'B08YZQMXYZ',
    title: 'Root - Jogo Assimétrico Estratégia',
    price: 'R$ 329,90',
    image: 'https://m.media-amazon.com/images/I/81FqVzJJqQL._AC_SY200_.jpg',
    rating: '4.6',
    store: 'Amazon.com.br',
    brand: 'Galápagos'
  }
];

function getMockProducts(keywords, limit = 10) {
  const keyword = keywords.toLowerCase();

  // Filtra por marca ou palavra-chave
  let filtered = MOCK_PRODUCTS.filter(p =>
    p.title.toLowerCase().includes(keyword) ||
    p.brand.toLowerCase().includes(keyword)
  );

  // Se não encontrar pela palavra-chave, retorna alguns produtos aleatórios
  if (filtered.length === 0) {
    filtered = MOCK_PRODUCTS;
  }

  // Embaralha e limita
  return filtered
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(limit, 10))
    .map(p => ({
      ...p,
      affiliate_url: buildSearchUrl(p.title),
      url: buildSearchUrl(p.title)
    }));
}

// Os ASINs deste banco são exemplos e podem não existir mais na Amazon (dá 404).
// Por isso o link aponta para a BUSCA da Amazon pelo nome do produto + tag de afiliado:
// nunca dá página inexistente, mostra produtos reais em estoque, e a comissão é rastreada
// normalmente em qualquer compra feita na sessão.
function buildSearchUrl(title, tagOverride) {
  const tag = tagOverride || process.env.AMAZON_PARTNER_TAG || 'tainadadecio-20';
  return `https://www.amazon.com.br/s?k=${encodeURIComponent(title)}&tag=${tag}`;
}

// Link de "melhores ofertas" de uma marca/categoria: busca na Amazon ordenada pelo
// menor preço (s=price-asc-rank), dentro de Brinquedos e Jogos (i=toys), já com a tag
// de afiliado. Abre os produtos reais mais baratos daquela marca — melhor valor primeiro.
function buildOfferUrl(term, tagOverride) {
  const tag = tagOverride || process.env.AMAZON_PARTNER_TAG || 'tainadadecio-20';
  return `https://www.amazon.com.br/s?k=${encodeURIComponent(term)}&i=toys&s=price-asc-rank&tag=${tag}`;
}

function getMockProductByASIN(asin) {
  const product = MOCK_PRODUCTS.find(p => p.asin === asin);
  if (product) {
    return {
      ...product,
      affiliate_url: buildSearchUrl(product.title),
      url: buildSearchUrl(product.title)
    };
  }
  return null;
}

module.exports = { getMockProducts, getMockProductByASIN, buildSearchUrl, buildOfferUrl };
