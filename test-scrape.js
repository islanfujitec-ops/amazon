const axios = require('axios');
const cheerio = require('cheerio');

async function testScrape() {
  try {
    const url = 'https://www.amazon.com.br/s?k=Asmodee';

    console.log('📡 Fazendo requisição para:', url);

    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    console.log(`✅ Página carregada (${data.length} bytes)\n`);

    const $ = cheerio.load(data);

    console.log('🔍 Procurando por seletores...\n');

    console.log('1. [data-component-type="s-search-result"]:', $('[data-component-type="s-search-result"]').length);
    console.log('2. [data-grid-index]:', $('[data-grid-index]').length);
    console.log('3. .s-result-item:', $('.s-result-item').length);
    console.log('4. div[class*="s-result"]:', $('div[class*="s-result"]').length);

    console.log('\n📋 Primeiras 3 divs com data-asin:\n');

    $('[data-asin]').slice(0, 3).each((i, elem) => {
      const $elem = $(elem);
      const asin = $elem.attr('data-asin');
      const title = $elem.find('h2 span, h2 a span').first().text()?.substring(0, 50);
      console.log(`${i + 1}. ASIN: ${asin} | Título: ${title}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testScrape();
