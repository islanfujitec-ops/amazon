const axios = require('axios');
require('dotenv').config({ path: '.env.amazon' });

const CREDENTIAL_ID = process.env.AMAZON_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREDENTIAL_SECRET;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;

console.log('🔍 Testando autenticação direta PAAPI5...\n');

async function testDirectAuth() {
  try {
    const payload = {
      Keywords: 'Teste',
      PartnerTag: PARTNER_TAG,
      Marketplace: 'www.amazon.com.br',
      MaxResults: 1
    };

    console.log('📡 Testando com Basic Auth (Credential ID + Secret)\n');

    const auth = Buffer.from(`${CREDENTIAL_ID}:${CREDENTIAL_SECRET}`).toString('base64');

    const response = await axios.post('https://api.amazon.com/paapi5/searchitems', payload, {
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'ProductAdvertisingAPI.SearchItems',
        'Authorization': `Basic ${auth}`
      },
      timeout: 10000
    });

    console.log('✅ SUCESSO!\n');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Erro com Basic Auth\n');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Erro:', error.message);
    }

    console.log('\n\n🔄 Tentando com Bearer Token direto (Credential Secret como token)...\n');

    try {
      const payload2 = {
        Keywords: 'Teste',
        PartnerTag: PARTNER_TAG,
        Marketplace: 'www.amazon.com.br',
        MaxResults: 1
      };

      const response2 = await axios.post('https://api.amazon.com/paapi5/searchitems', payload2, {
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'ProductAdvertisingAPI.SearchItems',
          'Authorization': `Bearer ${CREDENTIAL_SECRET}`
        },
        timeout: 10000
      });

      console.log('✅ SUCESSO com Bearer Token!\n');
      console.log(JSON.stringify(response2.data, null, 2));

    } catch (error2) {
      console.log('❌ Erro com Bearer Token\n');
      if (error2.response) {
        console.log('Status:', error2.response.status);
        console.log('Error:', JSON.stringify(error2.response.data, null, 2));
      }
    }
  }
}

testDirectAuth();
