# 🎲 Price Monitor - Jogos & Cartas

Monitor automático de preços de jogos e cartas colecionáveis na Amazon, com notificações via WhatsApp.

## 🚀 Funcionalidades

- ✅ Monitora preços automaticamente a cada hora (configurável 5min até 12h)
- ✅ Busca em Amazon.com.br e Amazon Global
- ✅ 20+ marcas de jogos cadastradas
- ✅ Alertas em tempo real via WhatsApp
- ✅ Dashboard intuitivo
- ✅ Histórico de preços
- ✅ Configuração simples e segura

## 🛠️ Instalação

### 1. Clone o repositório
```bash
cd price-monitor-games
npm install
```

### 2. Configure o Supabase

Crie uma conta em [supabase.com](https://supabase.com) e crie um novo projeto.

Crie as tabelas necessárias:

```sql
-- Tabela de configurações
CREATE TABLE config (
  id INT PRIMARY KEY DEFAULT 1,
  whatsapp_number VARCHAR(20),
  frequency_minutes INT DEFAULT 60,
  send_alerts BOOLEAN DEFAULT false,
  min_discount_percent INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  target_price DECIMAL(10,2),
  notify_on_discount BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de histórico de preços
CREATE TABLE price_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id VARCHAR(255),
  price DECIMAL(10,2),
  store VARCHAR(100),
  url TEXT,
  checked_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Configure variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

WHATSAPP_API_URL=sua_api_whatsapp
WHATSAPP_PHONE_NUMBER=55XXXXXXXXXX

NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=seu_secret_aleatorio
```

## 📱 Configurar WhatsApp

### Opção 1: Twilio (Recomendado)
1. Crie conta em [twilio.com](https://twilio.com)
2. Ative WhatsApp Sandbox
3. Use a URL do Twilio como `WHATSAPP_API_URL`

### Opção 2: Evolution API
1. Instale [Evolution API](https://github.com/EvolutionAPI/evolution-api)
2. Faça login via QR Code
3. Configure o endpoint

### Opção 3: WhatsApp Business API
1. Aplique em [facebook.com/business](https://facebook.com/business)
2. Configure as credenciais

## 🚀 Usar localmente

```bash
npm run dev
```

Acesse http://localhost:3000

## 📤 Deploy na Vercel

```bash
npm install -g vercel
vercel
```

Configure as variáveis de ambiente no painel da Vercel.

### Configurar Cron Job

Na Vercel, vá para **Settings > Cron Jobs** e configure:

```
/api/cron/monitor
```

Com frequência configurada no dashboard (padrão: 1 hora).

## 📋 Usar

1. **Dashboard**: http://localhost:3000/dashboard
2. Configure seu número WhatsApp
3. Defina a frequência de verificação
4. Adicione produtos para monitorar
5. Receba alertas automáticos!

## 📊 API Endpoints

- `GET /api/cron/monitor` - Executa verificação de preços (requer Bearer token)

## 🔐 Segurança

- Nenhuma senha armazenada
- Chaves API em variáveis de ambiente
- Validação em todas as requests

## 🐛 Troubleshooting

**Não recebo alertas WhatsApp?**
- Verifique se o número está correto (formato: 55XXXXXXXXXX)
- Verifique se `send_alerts` está ativado
- Verifique logs no console

**Scraper não funciona?**
- Amazon pode bloquear requests muito rápidos
- Implemente delays entre requests
- Considere usar proxy se necessário

## 📝 Roadmap

- [ ] Integração com mais lojas (Kabum, Mercado Livre, etc)
- [ ] Gráficos de histórico de preços
- [ ] Filtros avançados
- [ ] Comparação de preços entre lojas
- [ ] Exportar dados em CSV

## 📄 Licença

MIT

---

Feito com ❤️ para os gamers brasileiros!
