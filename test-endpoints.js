const axios = require('axios');
require('dotenv').config({ path: '.env.amazon' });

const CREDENTIAL_ID = process.env.AMAZON_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREDENTIAL_SECRET;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;

console.log('🔍 Testando diferentes endpoints e métodos...\n');

const endpoints = [
  {
    name: 'Endpoint oficial OAuth',
    url: 'https://api.amazon.com/auth/o2/token',
    method: 'POST'
  },
  {
    name: 'Endpoint regional (us-east-1)',
    url: 'https://auth.us-east-1.amazon.com/oauth2/authorize',
    method: 'POST'
  },
  {
    name: 'Endpoint da API diretamente (sem auth)',
    url: 'https://api.amazon.com/paapi5/searchitems',
    method: 'POST'
  }
];

async function testEndpoint(config) {
  console.log(`\n📡 ${config.name}`);
  console.log('URL:', config.url);
  console.log('-'.repeat(50));

  try {
    if (config.name.includes('diretamente')) {
      // Tenta usar credenciais diretamente
      const payload = {
        Keywords: 'Teste',
        PartnerTag: PARTNER_TAG,
        Marketplace: 'www.amazon.com.br',
        MaxResults: 1
      };

      const response = await axios[config.method.toLowerCase()](config.url, payload, {
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'ProductAdvertisingAPI.SearchItems',
          'X-Amz-Credential-Id': CREDENTIAL_ID,
          'X-Amz-Credential-Secret': CREDENTIAL_SECRET,
          'Authorization': `Bearer ${CREDENTIAL_SECRET}`
        },
        timeout: 5000
      });

      console.log('✅ Resposta recebida!');
      console.log(JSON.stringify(response.data, null, 2).substring(0, 200));

    } else {
      // OAuth
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CREDENTIAL_ID,
        client_secret: CREDENTIAL_SECRET,
        scope: 'oas'
      });

      const response = await axios.post(config.url, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000
      });

      console.log('✅ Token obtido!');
      console.log('Token:', response.data.access_token?.substring(0, 50) + '...');
    }

  } catch (error) {
    const status = error.response?.status || error.code;
    const msg = error.response?.data?.error_description ||
                error.response?.data?.message ||
                error.message;
    console.log(`❌ ${status}: ${msg}`);
  }
}

async function test() {
  for (const config of endpoints) {
    await testEndpoint(config);
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('💡 CONCLUSÃO:');
  console.log('As credenciais OAuth2 da Amazon exigem um escopo válido.');
  console.log('Escopo válido pode ser: "oas", "amzn.oas.scope", ou outro.');
  console.log('Recomendação: Contate suporte da Amazon para o escopo correto.');
}

test();
