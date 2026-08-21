const axios = require('axios');
require('dotenv').config({ path: '.env.amazon' });

const CREDENTIAL_ID = process.env.AMAZON_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREDENTIAL_SECRET;

const SCOPES_TO_TRY = [
  'paapi5.shopping',
  'paapi5',
  'paapi',
  'prod:all',
  'ProductAdvertisingAPI.All',
  '',
  'default'
];

async function testScope(scope) {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CREDENTIAL_ID);
    params.append('client_secret', CREDENTIAL_SECRET);

    if (scope) {
      params.append('scope', scope);
    }

    const response = await axios.post('https://api.amazon.com/auth/o2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 5000
    });

    console.log(`✅ SUCESSO com scope: "${scope}"`);
    console.log('Token:', response.data.access_token.substring(0, 50) + '...');
    return true;
  } catch (error) {
    const errMsg = error.response?.data?.error_description || error.message;
    console.log(`❌ Scope "${scope}": ${errMsg}`);
    return false;
  }
}

async function test() {
  console.log('🔍 Testando diferentes scopes...\n');

  for (const scope of SCOPES_TO_TRY) {
    await testScope(scope);
  }
}

test();
