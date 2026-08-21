const axios = require('axios');
require('dotenv').config({ path: '.env.amazon' });

const CREDENTIAL_ID = process.env.AMAZON_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREDENTIAL_SECRET;

console.log('🔍 Teste detalhado de OAuth2...\n');
console.log('Credential ID:', CREDENTIAL_ID);
console.log('Credential Secret (primeiros 30 chars):', CREDENTIAL_SECRET.substring(0, 30) + '...\n');

async function testOAuth() {
  // Teste 1: com diferentes headers
  const configs = [
    {
      name: 'Teste 1: Basic OAuth (sem scope)',
      params: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CREDENTIAL_ID,
        client_secret: CREDENTIAL_SECRET
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    },
    {
      name: 'Teste 2: Com scope vazio',
      params: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CREDENTIAL_ID,
        client_secret: CREDENTIAL_SECRET,
        scope: ''
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    },
    {
      name: 'Teste 3: Com scope "oas"',
      params: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CREDENTIAL_ID,
        client_secret: CREDENTIAL_SECRET,
        scope: 'oas'
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    },
    {
      name: 'Teste 4: JSON format',
      params: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: CREDENTIAL_ID,
        client_secret: CREDENTIAL_SECRET
      }),
      headers: { 'Content-Type': 'application/json' }
    }
  ];

  for (const config of configs) {
    console.log(`\n${config.name}`);
    console.log('='.repeat(50));

    try {
      const response = await axios.post(
        'https://api.amazon.com/auth/o2/token',
        config.params,
        {
          headers: {
            ...config.headers,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          timeout: 8000
        }
      );

      console.log('✅ SUCESSO!');
      console.log('Access Token:', response.data.access_token.substring(0, 50) + '...');
      console.log('Expires In:', response.data.expires_in, 'segundos');
      console.log('\n🎉 Teste bem-sucedido! Use este formato.');
      return response.data.access_token;

    } catch (error) {
      const status = error.response?.status;
      const errData = error.response?.data;

      console.log(`❌ Status ${status}`);

      if (typeof errData === 'string') {
        console.log('Response:', errData.substring(0, 100));
      } else if (errData?.error) {
        console.log('Error:', errData.error);
        console.log('Description:', errData.error_description);
      } else {
        console.log('Error:', error.message);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Se todos falharem, tente contatar suporte da Amazon.');
}

testOAuth();
