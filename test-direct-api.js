const axios = require('axios');
require('dotenv').config({ path: '.env.amazon' });

const CREDENTIAL_ID = process.env.AMAZON_CREDENTIAL_ID;
const CREDENTIAL_SECRET = process.env.AMAZON_CREDENTIAL_SECRET;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG;

console.log('🔍 Testando acesso direto à API (sem OAuth2)...\n');

async function testDirectAPI() {
  const payload = {
    Keywords: 'Asmodee',
    PartnerTag: PARTNER_TAG,
    Marketplace: 'www.amazon.com.br',
    MaxResults: 5
  };

  const methods = [
    {
      name: 'Método 1: Bearer Token (Secret como token)',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'ProductAdvertisingAPI.SearchItems',
        'Authorization': `Bearer ${CREDENTIAL_SECRET}`
      }
    },
    {
      name: 'Método 2: Basic Auth (ID:Secret)',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'ProductAdvertisingAPI.SearchItems',
        'Authorization': 'Basic ' + Buffer.from(`${CREDENTIAL_ID}:${CREDENTIAL_SECRET}`).toString('base64')
      }
    },
    {
      name: 'Método 3: Headers customizados',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'ProductAdvertisingAPI.SearchItems',
        'X-Amz-Credential-Id': CREDENTIAL_ID,
        'X-Amz-Credential-Secret': CREDENTIAL_SECRET
      }
    },
    {
      name: 'Método 4: Token como X-Amz-Access-Token',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'ProductAdvertisingAPI.SearchItems',
        'X-Amz-Access-Token': CREDENTIAL_SECRET
      }
    },
    {
      name: 'Método 5: Sem Authorization (apenas Partner Tag)',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'ProductAdvertisingAPI.SearchItems',
        'X-Amz-Partner-Tag': PARTNER_TAG
      }
    }
  ];

  for (const method of methods) {
    console.log(`\n${method.name}`);
    console.log('-'.repeat(60));

    try {
      const response = await axios.post(
        'https://api.amazon.com/paapi5/searchitems',
        payload,
        { headers: method.headers, timeout: 8000 }
      );

      console.log('✅ SUCESSO!');
      console.log('Produtos encontrados:', response.data.SearchResult?.Items?.length || 0);

      if (response.data.SearchResult?.Items?.[0]) {
        const item = response.data.SearchResult.Items[0];
        console.log('Primeiro produto:', item.ItemInfo?.Title?.DisplayValue?.substring(0, 50));
      }

      return {
        success: true,
        method: method.name
      };

    } catch (error) {
      const status = error.response?.status;
      const errMsg = error.response?.data?.Errors?.[0]?.Message ||
                     error.response?.data?.error_description ||
                     error.message;

      console.log(`❌ Status ${status}: ${errMsg}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 Próximas ações:');
  console.log('1. Verifique se a aplicação precisa de aprovação adicional');
  console.log('2. Valide se o Partner Tag está ativo');
  console.log('3. Contacte: suporte@associados.amazon.com.br');
  console.log('4. Peça: "Método de autenticação para Creators API v3.1"');
}

testDirectAPI();
