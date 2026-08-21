const axios = require('axios');
require('dotenv').config({ path: '.env.amazon' });

const CREDENTIAL_ID = process.env.AMAZON_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREDENTIAL_SECRET;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;

console.log('🔍 Teste Creators API com novo escopo...\n');

async function test() {
  try {
    // Passo 1: Obter token
    console.log('📡 Obtendo token com escopo creatorsapi::default...');

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CREDENTIAL_ID);
    params.append('client_secret', CREDENTIAL_SECRET);
    params.append('scope', 'creatorsapi::default');

    const authResponse = await axios.post(
      'https://api.amazon.com/auth/o2/token',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const token = authResponse.data.access_token;
    console.log('✅ Token obtido!\n');

    // Passo 2: Chamar API Creators
    console.log('📡 Chamando creatorsapi.amazon/catalog/v1/searchItems...\n');

    const payload = {
      keywords: 'Asmodee',
      partnerTag: PARTNER_TAG,
      marketplace: 'www.amazon.com.br',
      maxResults: 5,
      resources: [
        'images.primary.large',
        'itemInfo.title',
        'offers.listings.price'
      ]
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('');

    const apiResponse = await axios.post(
      'https://creatorsapi.amazon/catalog/v1/searchItems',
      payload,
      {
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'Authorization': `Bearer ${token}`,
          'x-marketplace': 'www.amazon.com.br'
        }
      }
    );

    console.log('✅ SUCESSO! Produtos encontrados:');
    console.log(JSON.stringify(apiResponse.data, null, 2));

  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;

    console.log('❌ ERRO:');
    console.log('Status:', status);
    console.log('Response:', JSON.stringify(data, null, 2));

    // Tentar diferentes formatos
    if (status === 400) {
      console.log('\n💡 Erro 400 pode ser formato do payload.');
      console.log('Tentando sem alguns campos...\n');

      try {
        const simplePayload = {
          keywords: 'Asmodee',
          partnerTag: PARTNER_TAG
        };

        const token = (await axios.post(
          'https://api.amazon.com/auth/o2/token',
          params,
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )).data.access_token;

        const response2 = await axios.post(
          'https://creatorsapi.amazon/catalog/v1/searchItems',
          simplePayload,
          {
            headers: {
              'Content-Type': 'application/x-amz-json-1.1',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        console.log('✅ Funcionou com payload simples!\n');
        console.log(JSON.stringify(response2.data, null, 2));

      } catch (error2) {
        console.log('❌ Ainda erro:', error2.response?.status, error2.response?.data);
      }
    }
  }
}

test();
