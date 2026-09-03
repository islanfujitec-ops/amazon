const axios = require('axios');
const { getMockProducts, getMockProductByASIN } = require('./mockProducts');
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

async function searchAmazonProducts(keywords, maxResults = 10) {
  try {
    if (!CREDENTIAL_ID || !CREDENTIAL_SECRET || !PARTNER_TAG) {
      console.error('❌ Credenciais não configuradas');
      return getMockProducts(keywords, maxResults);
    }

    console.log(`🔍 Buscando: "${keywords}"...`);

    const token = await getOAuth2Token();

    if (!token) {
      console.log('   ⚠️ Sem token, usando banco de dados');
      return getMockProducts(keywords, maxResults);
    }

    console.log('   📡 Chamando API Creators...');

    const payload = {
      keywords: keywords,
      partnerTag: PARTNER_TAG,
      marketplace: MARKETPLACE,
      maxResults: Math.min(maxResults, 10),
      sortBy: 'Price:LowToHigh', // mais barato primeiro
      resources: [
        'images.primary.large',
        'itemInfo.title',
        'itemInfo.externalIds',
        'offersV2.listings.price',
        'offersV2.listings.savingBasis',
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
      const results = response.data.searchResult.items.map(item => ({
        asin: item.asin,
        title: item.itemInfo?.title?.displayValue || 'Sem título',
        price: item.offersV2?.listings?.[0]?.price?.displayPrice || 'N/A',
        image: item.images?.primary?.large?.url || '',
        rating: item.customerReviews?.starRating?.displayValue || 'N/A',
        url: `https://www.amazon.com.br/dp/${item.asin}`,
        store: 'Amazon.com.br',
        affiliate_url: `https://www.amazon.com.br/dp/${item.asin}?tag=${PARTNER_TAG}`
      }));

      console.log(`✅ ${results.length} produtos encontrados da API REAL`);
      return results;
    }

    console.log('⚠️ Nenhum resultado na API, usando banco de dados');
    return getMockProducts(keywords, maxResults);

  } catch (error) {
    const status = error.response?.status;
    const errMsg = error.response?.data?.Errors?.[0]?.Message || error.message;

    console.log(`⚠️ Erro na API (${status}): ${errMsg}`);
    console.log('   Usando banco de dados como fallback');

    return getMockProducts(keywords, maxResults);
  }
}

async function getProductByASIN(asin) {
  try {
    if (!CREDENTIAL_ID || !CREDENTIAL_SECRET || !PARTNER_TAG || !asin) {
      return getMockProductByASIN(asin);
    }

    console.log(`🔍 Buscando ASIN: ${asin}...`);

    const token = await getOAuth2Token();

    if (!token) {
      return getMockProductByASIN(asin);
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

      return {
        asin: item.asin,
        title: item.itemInfo?.title?.displayValue || 'Sem título',
        price: item.offersV2?.listings?.[0]?.price?.displayPrice || 'N/A',
        image: item.images?.primary?.large?.url || '',
        rating: item.customerReviews?.starRating?.displayValue || 'N/A',
        url: `https://www.amazon.com.br/dp/${item.asin}`,
        store: 'Amazon.com.br',
        affiliate_url: `https://www.amazon.com.br/dp/${item.asin}?tag=${PARTNER_TAG}`
      };
    }

    return getMockProductByASIN(asin);

  } catch (error) {
    console.error('❌ Erro ao buscar ASIN:', error.message);
    return getMockProductByASIN(asin);
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
      resources: ['itemInfo.title', 'offersV2.listings.price']
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
