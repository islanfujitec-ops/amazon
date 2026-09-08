const axios = require('axios');
require('dotenv').config({ path: '.env.amazon' });

const CREDENTIAL_ID = process.env.AMAZON_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREDENTIAL_SECRET;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;
const MARKETPLACE = 'www.amazon.com.br';

let cachedToken = null;
let tokenExpiry = null;

async function getOAuth2Token() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CREDENTIAL_ID);
    params.append('client_secret', CREDENTIAL_SECRET);
    params.append('scope', 'creatorsapi::default');

    console.log('🔑 Obtendo token OAuth2...');

    const response = await axios.post(
      'https://api.amazon.com/auth/o2/token',
      params,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 8000
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;

    console.log('✅ Token obtido com sucesso!');
    return cachedToken;
  } catch (error) {
    console.error('❌ Erro ao obter token:', error.response?.data || error.message);
    return null;
  }
}

// Converte um item da Creators API no formato usado pelo app.
// A resposta traz o preco em offersV2.listings[0].price.money.displayAmount,
// o preco cheio em price.savingBasis e o desconto em price.savings.percentage.
// detailPageURL ja vem com a tag de afiliado (link oficial da Amazon).
function mapItem(item) {
  const listing = item.offersV2?.listings?.[0];
  const price = listing?.price;
  return {
    asin: item.asin,
    title: item.itemInfo?.title?.displayValue || 'Sem titulo',
    price: price?.money?.displayAmount || null,
    oldPrice: price?.savingBasis?.money?.displayAmount || null,
    discount: price?.savings?.percentage || 0,
    image: item.images?.primary?.large?.url || '',
    rating: item.customerReviews?.starRating?.displayValue || null,
    store: 'Amazon.com.br',
    url: `https://www.amazon.com.br/dp/${item.asin}`,
    affiliate_url: item.detailPageURL || `https://www.amazon.com.br/dp/${item.asin}?tag=${PARTNER_TAG}`
  };
}

async function searchAmazonProducts(keywords, maxResults = 10, sortBy = null) {
  try {
    if (!CREDENTIAL_ID || !CREDENTIAL_SECRET || !PARTNER_TAG) {
      console.error('❌ Credenciais não configuradas');
      return [];
    }

    console.log(`🔍 Buscando: "${keywords}"...`);

    const token = await getOAuth2Token();

    if (!token) {
      console.log('   ⚠️ Sem token da API');
      return [];
    }

    console.log('   📡 Chamando API Creators...');

    const payload = {
      keywords: keywords,
      partnerTag: PARTNER_TAG,
      marketplace: MARKETPLACE,
      maxResults: Math.min(maxResults, 10),
      ...(sortBy ? { sortBy } : {}),
      resources: [
        'images.primary.large',
        'itemInfo.title',
        'offersV2.listings.price',
        'customerReviews.starRating'
      ]
    };

    const response = await axios.post(
      'https://creatorsapi.amazon/catalog/v1/searchItems',
      payload,
      {
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'Authorization': `Bearer ${token}`,
          'x-marketplace': MARKETPLACE
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.searchResult && response.data.searchResult.items) {
      const results = response.data.searchResult.items.map(mapItem);

      console.log(`✅ ${results.length} produtos encontrados da API REAL`);
      return results;
    }

    console.log('⚠️ Nenhum resultado real na API');
    return [];

  } catch (error) {
    const status = error.response?.status;
    const errMsg = error.response?.data?.Errors?.[0]?.Message || error.message;

    console.log(`⚠️ Erro na API (${status}): ${errMsg}`);
    console.log('   Sem dados reais no momento');

    return [];
  }
}

async function getProductByASIN(asin) {
  try {
    if (!CREDENTIAL_ID || !CREDENTIAL_SECRET || !PARTNER_TAG || !asin) {
      return null;
    }

    console.log(`🔍 Buscando ASIN: ${asin}...`);

    const token = await getOAuth2Token();

    if (!token) {
      return null;
    }

    const payload = {
      itemIds: [asin],
      partnerTag: PARTNER_TAG,
      marketplace: MARKETPLACE,
      resources: [
        'images.primary.large',
        'itemInfo.title',
        'offersV2.listings.price',
        'customerReviews.starRating'
      ]
    };

    const response = await axios.post(
      'https://creatorsapi.amazon/catalog/v1/getItems',
      payload,
      {
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'Authorization': `Bearer ${token}`,
          'x-marketplace': MARKETPLACE
        },
        timeout: 10000
      }
    );

    if (response.data?.itemsResult?.items?.[0]) {
      const item = response.data.itemsResult.items[0];
      console.log('✅ Produto encontrado da API REAL');

      return mapItem(item);
    }

    return null;

  } catch (error) {
    console.error('❌ Erro ao buscar ASIN:', error.message);
    return null;
  }
}

// Diagnóstico: retorna o erro REAL de cada etapa (sem fallback), para depuração.
async function debugApi(keywords = 'Catan') {
  const out = { step: 'inicio', credentials: {
    hasId: !!CREDENTIAL_ID, hasSecret: !!CREDENTIAL_SECRET, partnerTag: PARTNER_TAG || null
  }};

  // Etapa 1: OAuth2
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CREDENTIAL_ID || '');
    params.append('client_secret', CREDENTIAL_SECRET || '');
    params.append('scope', 'creatorsapi::default');

    const tokenResp = await axios.post('https://api.amazon.com/auth/o2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 8000
    });
    out.oauth = { ok: true, hasToken: !!tokenResp.data.access_token, expiresIn: tokenResp.data.expires_in };
    var token = tokenResp.data.access_token;
  } catch (e) {
    out.step = 'oauth_falhou';
    out.oauth = { ok: false, status: e.response?.status, data: e.response?.data || e.message };
    return out;
  }

  // Etapa 2: searchItems
  try {
    const payload = {
      keywords, partnerTag: PARTNER_TAG, marketplace: MARKETPLACE, maxResults: 3,
      resources: ['itemInfo.title', 'offersV2.listings.price',
                  'offersV2.listings.deliveryInfo.isFreeShippingEligible',
                  'offersV2.listings.deliveryInfo.isPrimeEligible',
                  'offersV2.listings.deliveryInfo.isAmazonFulfilled']
    };
    const resp = await axios.post('https://creatorsapi.amazon/catalog/v1/searchItems', payload, {
      headers: { 'Content-Type': 'application/x-amz-json-1.1', 'Authorization': `Bearer ${token}`, 'x-marketplace': MARKETPLACE },
      timeout: 10000
    });
    out.step = 'sucesso';
    out.search = { ok: true, itemsCount: resp.data?.searchResult?.items?.length || 0, sample: resp.data?.searchResult?.items?.[0] || null };
  } catch (e) {
    out.step = 'search_falhou';
    out.search = { ok: false, status: e.response?.status, code: e.code, data: e.response?.data || e.message };
  }
  return out;
}

module.exports = { searchAmazonProducts, getProductByASIN, debugApi };
