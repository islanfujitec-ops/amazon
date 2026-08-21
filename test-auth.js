const axios = require('axios');
require('dotenv').config({ path: '.env.amazon' });

const CREDENTIAL_ID = process.env.AMAZON_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREDENTIAL_SECRET;

console.log('🔍 Testando Autenticação OAuth2 com Amazon...\n');
console.log('Credential ID:', CREDENTIAL_ID.substring(0, 30) + '...');
console.log('Credential Secret:', CREDENTIAL_SECRET.substring(0, 30) + '...');
console.log('');

async function testAuth() {
  try {
    console.log('📡 Enviando requisição para:', 'https://api.amazon.com/auth/o2/token');

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CREDENTIAL_ID);
    params.append('client_secret', CREDENTIAL_SECRET);

    console.log('📋 Payload:', {
      grant_type: 'client_credentials',
      client_id: CREDENTIAL_ID.substring(0, 30) + '...',
      client_secret: CREDENTIAL_SECRET.substring(0, 30) + '...',
      scope: 'paapi5.shopping'
    });
    console.log('');

    const response = await axios.post('https://api.amazon.com/auth/o2/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    });

    console.log('✅ SUCESSO! Token obtido:\n');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ ERRO na autenticação:\n');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      console.log('\nHeaders:', error.response.headers);
    } else {
      console.log('Erro:', error.message);
    }
  }
}

testAuth();
