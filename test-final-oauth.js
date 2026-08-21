const axios = require('axios');
require('dotenv').config({ path: '.env.amazon' });

const CREDENTIAL_ID = process.env.AMAZON_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREDENTIAL_SECRET;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;

console.log('🔍 TESTE FINAL - API ATIVA CONFIRMADA\n');
console.log('Credential ID:', CREDENTIAL_ID);
console.log('Partner Tag:', PARTNER_TAG);
console.log('\n' + '='.repeat(60) + '\n');

const SCOPES = [
  'oas',
  'amzn.oas.scope',
  'amzn:oas:api:*',
  'paapi5',
  'paapi5:shopping',
  'ProductAdvertisingAPI',
  'product_advertising_api',
  'amzn.oas.api.*',
  'amzn:oas',
  'oas:api'
];

async function testScope(scope) {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CREDENTIAL_ID);
    params.append('client_secret', CREDENTIAL_SECRET);
    params.append('scope', scope);

    console.log(`Testando scope: "${scope}"...`);

    const response = await axios.post(
      'https://api.amazon.com/auth/o2/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 8000
      }
    );

    console.log('✅ SUCESSO! Token obtido:\n');
    console.log('Access Token:', response.data.access_token.substring(0, 60) + '...');
    console.log('Tipo:', response.data.token_type);
    console.log('Expira em:', response.data.expires_in, 'segundos');
    console.log('\n🎉 Escopo correto encontrado!\n');

    return {
      success: true,
      scope: scope,
      token: response.data.access_token
    };

  } catch (error) {
    const err = error.response?.data?.error_description || error.message;
    console.log(`❌ "${scope}": ${err}\n`);
    return null;
  }
}

async function test() {
  console.log('Testando escopos...\n');

  for (const scope of SCOPES) {
    const result = await testScope(scope);
    if (result) {
      console.log('💾 Salvando escopo funcionando...\n');
      return result;
    }
  }

  console.log('='.repeat(60));
  console.log('Nenhum escopo funcionou. Tente:');
  console.log('1. Verificar se há um escopo específico no portal da Amazon');
  console.log('2. Contatar suporte: suporte@associados.amazon.com.br');
  console.log('3. Perguntar: "Qual é o escopo OAuth2 para Creators API v3.1?"');
}

test();
