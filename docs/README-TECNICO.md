# Soul Collect - Documentação Técnica

## Índice
1. [Visão Geral](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Setup Local](#setup-local)
5. [Banco de Dados](#banco-de-dados)
6. [API Endpoints](#api-endpoints)
7. [Autenticação](#autenticação)
8. [Integrações Pendentes](#integrações-pendentes)
9. [Deploy em Produção](#deploy-em-produção)
10. [Migração para Outro Ambiente](#migração-para-outro-ambiente)

---

## Visão Geral

Soul Collect é uma plataforma completa de gestão de cobrança com:
- Dashboard com métricas em tempo real
- Gestão de casos de inadimplência
- Jornadas automatizadas de cobrança
- Integração WhatsApp Business (preparada)
- Geração de PIX e Boletos (mock - precisa integrar)
- Gestão de consentimentos LGPD
- Supervisor de riscos com alertas automáticos
- Sistema completo de permissões (RBAC)

---

## Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 3.x | Estilização |
| Vite | 5.x | Build tool |
| React Router | 6.x | Roteamento SPA |
| Lucide React | - | Ícones |
| Recharts | - | Gráficos |

### Backend
| Tecnologia | Uso |
|------------|-----|
| Cloudflare Workers | Runtime serverless |
| Hono | Framework HTTP (similar ao Express) |
| D1 | Banco SQLite gerenciado |
| R2 | Object storage (arquivos) |

### Autenticação
- OAuth 2.0 via Mocha Users Service (Google OAuth)
- JWT via cookies HttpOnly
- Sistema RBAC próprio com roles e permissions

---

## Estrutura do Projeto

```
soul-collect/
├── src/
│   ├── react-app/              # Frontend React
│   │   ├── components/         # Componentes reutilizáveis
│   │   │   ├── Layout.tsx      # Layout principal com sidebar
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── ...
│   │   ├── pages/              # Páginas/rotas
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Cases.tsx
│   │   │   ├── CaseDetail.tsx
│   │   │   ├── Journeys.tsx
│   │   │   ├── Supervisor.tsx
│   │   │   ├── Consent.tsx
│   │   │   ├── Integrations.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── ...
│   │   ├── hooks/              # React hooks customizados
│   │   │   └── useAuth.tsx     # Contexto de autenticação
│   │   ├── App.tsx             # Roteamento principal
│   │   └── main.tsx            # Entry point
│   │
│   ├── worker/                 # Backend (Cloudflare Worker)
│   │   └── index.ts            # API endpoints (Hono)
│   │
│   └── shared/                 # Tipos compartilhados
│       └── types.ts
│
├── public/                     # Assets estáticos
├── migrations/                 # Migrações D1 (SQLite)
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── wrangler.json              # Config Cloudflare
└── tsconfig.json
```

---

## Setup Local

### Pré-requisitos
- Node.js 18+
- npm ou pnpm
- Conta Cloudflare (para D1 e Workers)

### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar Wrangler (CLI Cloudflare)
npm install -g wrangler
wrangler login

# 3. Criar banco D1 (se não existir)
wrangler d1 create soul-collect-db

# 4. Atualizar wrangler.json com o database_id

# 5. Rodar migrações
wrangler d1 migrations apply soul-collect-db

# 6. Iniciar dev server
npm run dev
```

### Variáveis de Ambiente

Criar arquivo `.dev.vars` na raiz:

```env
# Autenticação Mocha (já configurado)
MOCHA_USERS_SERVICE_API_URL=https://users.getmocha.com
MOCHA_USERS_SERVICE_API_KEY=xxx

# WhatsApp Business API (configurar)
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_VERIFY_TOKEN=

# Integração Bancária (configurar)
BANK_API_KEY=
BANK_API_SECRET=
BANK_ENVIRONMENT=sandbox

# Opcional
SENTRY_DSN=
```

---

## Banco de Dados

### Diagrama ER Simplificado

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  app_users  │────<│     cases       │────<│case_timeline │
└─────────────┘     └─────────────────┘     └──────────────┘
       │                    │
       │                    ├──────<┌─────────────────────┐
       │                    │       │  case_installments  │
       │                    │       └─────────────────────┘
       │                    │
       │                    ├──────<┌──────────────┐
       │                    │       │   payments   │
       │                    │       └──────────────┘
       │                    │
       │                    ├──────<┌────────────────────┐
       │                    │       │ whatsapp_messages  │
       │                    │       └────────────────────┘
       │                    │
       │                    └──────<┌────────────────────┐
       │                            │  consent_records   │
       │                            └────────────────────┘
       │
       ├──────────<┌─────────────┐
       │           │    roles    │
       │           └─────────────┘
       │                  │
       │                  └───────<┌───────────────────┐
       │                           │ role_permissions  │
       │                           └───────────────────┘
       │
       └──────────<┌─────────────┐
                   │ audit_logs  │
                   └─────────────┘
```

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `app_users` | Usuários do sistema (operadores, supervisores, admins) |
| `roles` | Perfis de acesso (Admin, Supervisor, Operador, Visualizador) |
| `permissions` | Permissões granulares |
| `role_permissions` | Relacionamento N:N roles-permissions |
| `cases` | Casos de cobrança (devedores) |
| `case_timeline` | Histórico de eventos de cada caso |
| `case_installments` | Parcelas de acordos |
| `journeys` | Jornadas automatizadas |
| `journey_steps` | Etapas de cada jornada |
| `payments` | Pagamentos PIX/Boleto gerados |
| `whatsapp_messages` | Mensagens WhatsApp enviadas/recebidas |
| `whatsapp_templates` | Templates aprovados WhatsApp |
| `consent_types` | Tipos de consentimento LGPD |
| `consent_records` | Registros de consentimento por cliente |
| `consent_history` | Histórico de alterações de consentimento |
| `risk_alerts` | Alertas de risco gerados |
| `risk_rules` | Regras para detecção de riscos |
| `supervisor_actions` | Ações pendentes para supervisores |
| `integrations` | Configurações de integrações externas |
| `webhook_endpoints` | Webhooks configurados |
| `webhook_logs` | Logs de entregas de webhook |
| `audit_logs` | Log de auditoria de todas as ações |
| `app_settings` | Configurações do sistema |

---

## API Endpoints

### Autenticação
```
GET  /api/oauth/google/redirect_url  # URL para login Google
POST /api/sessions                    # Trocar code por session
GET  /api/users/me                    # Usuário atual
GET  /api/logout                      # Encerrar sessão
```

### Casos
```
GET    /api/cases                # Listar casos (com filtros)
GET    /api/cases/stats          # Estatísticas
GET    /api/cases/:id            # Detalhe do caso
POST   /api/cases                # Criar caso
PUT    /api/cases/:id            # Atualizar caso
DELETE /api/cases/:id            # Excluir caso
POST   /api/cases/:id/timeline   # Adicionar evento
GET    /api/cases/export         # Exportar CSV
POST   /api/cases/import         # Importar JSON
```

### Jornadas
```
GET    /api/journeys             # Listar jornadas
GET    /api/journeys/:id         # Detalhe
POST   /api/journeys             # Criar
PUT    /api/journeys/:id         # Atualizar
DELETE /api/journeys/:id         # Excluir
POST   /api/journeys/:id/toggle  # Ativar/pausar
```

### Pagamentos
```
POST   /api/payments                    # Gerar PIX ou Boleto
GET    /api/cases/:id/payments          # Pagamentos do caso
GET    /api/payments/:id                # Detalhe
PUT    /api/payments/:id                # Atualizar status
POST   /api/payments/:id/simulate-callback  # Simular webhook
```

### WhatsApp
```
GET    /api/whatsapp/templates          # Listar templates
POST   /api/whatsapp/templates          # Criar template
PUT    /api/whatsapp/templates/:id      # Atualizar
DELETE /api/whatsapp/templates/:id      # Excluir
POST   /api/whatsapp/send               # Enviar mensagem
GET    /api/cases/:id/whatsapp          # Mensagens do caso
POST   /api/whatsapp/webhook            # Webhook Meta (recebe status)
GET    /api/whatsapp/webhook            # Verificação webhook Meta
```

### LGPD / Consentimentos
```
GET    /api/consent/types               # Tipos de consentimento
GET    /api/cases/:id/consents          # Consentimentos do caso
GET    /api/consent/by-document/:doc    # Por CPF/CNPJ
GET    /api/consent/stats               # Estatísticas
POST   /api/consent                     # Registrar consentimento
POST   /api/consent/:id/revoke          # Revogar
GET    /api/consent/:id/history         # Histórico
POST   /api/consent/bulk                # Importação em lote
GET    /api/consent/export/:document    # Exportar dados (portabilidade)
```

### Supervisor / Riscos
```
GET    /api/risk-alerts                 # Listar alertas
POST   /api/risk-alerts                 # Criar alerta manual
POST   /api/risk-alerts/:id/acknowledge # Reconhecer
POST   /api/risk-alerts/:id/resolve     # Resolver
GET    /api/supervisor/stats            # Estatísticas
GET    /api/risk-rules                  # Regras de risco
POST   /api/risk-rules                  # Criar regra
POST   /api/risk-rules/:id/toggle       # Ativar/desativar
POST   /api/supervisor/run-detection    # Executar detecção
```

### Configurações
```
GET    /api/settings                    # Todas as configs
GET    /api/settings/:group             # Configs por grupo
PUT    /api/settings/:group             # Atualizar grupo
PUT    /api/settings/:group/:key        # Atualizar uma config
```

### Admin
```
GET    /api/admin/users                 # Listar usuários
POST   /api/admin/users/invite          # Convidar usuário
PUT    /api/admin/users/:id             # Atualizar
DELETE /api/admin/users/:id             # Excluir
GET    /api/admin/roles                 # Listar roles
POST   /api/admin/roles                 # Criar role
GET    /api/admin/permissions           # Listar permissions
GET    /api/admin/audit-logs            # Logs de auditoria
```

---

## Autenticação

### Fluxo OAuth
1. Frontend chama `/api/oauth/google/redirect_url`
2. Usuário é redirecionado para Google
3. Google retorna com `code` para callback
4. Frontend envia `code` para `/api/sessions`
5. Backend troca code por token e cria sessão
6. Cookie `mocha_session_token` é setado (HttpOnly, Secure)
7. Requisições subsequentes incluem cookie automaticamente

### Middleware de Auth
```typescript
// Todas as rotas protegidas usam:
app.get("/api/...", authMiddleware, async (c) => {
  const user = c.get("user"); // Usuário Mocha
  // ...
});
```

### RBAC (Role-Based Access Control)
- **Admin**: Acesso total
- **Supervisor**: Gestão de equipe e aprovações
- **Operador**: Trabalho diário com casos
- **Visualizador**: Apenas leitura

Permissões verificadas no frontend via `user.appUser.permissions[]`.

---

## Integrações Pendentes

### 1. WhatsApp Business API

**Status atual:** Mock (simula envio/recebimento)

**Para integrar:**

1. Criar conta Meta Business: https://business.facebook.com
2. Criar app no Meta for Developers: https://developers.facebook.com
3. Ativar WhatsApp Business API
4. Obter:
   - `WHATSAPP_TOKEN` (token permanente)
   - `WHATSAPP_PHONE_ID` (ID do número)
   - `WHATSAPP_VERIFY_TOKEN` (para webhook)

5. Configurar webhook apontando para:
   ```
   https://seudominio.com/api/whatsapp/webhook
   ```

6. Modificar `POST /api/whatsapp/send` em `src/worker/index.ts`:

```typescript
// ANTES (mock):
const whatsappMessageId = generateWhatsAppMessageId();

// DEPOIS (real):
const response = await fetch(
  `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_ID}/messages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone_number,
      type: 'template', // ou 'text'
      template: {
        name: template_name,
        language: { code: 'pt_BR' },
        components: [/* variables */]
      }
    })
  }
);
const data = await response.json();
const whatsappMessageId = data.messages[0].id;
```

### 2. Integração Bancária (PIX/Boleto)

**Status atual:** Mock (gera códigos fictícios)

**Opções de provedores:**
- **Asaas** (recomendado para cobrança)
- **Efí/Gerencianet**
- **PagBank/PagSeguro**
- **Stripe** (internacional)

**Para integrar (exemplo Asaas):**

1. Criar conta: https://www.asaas.com
2. Obter API Key em Configurações > Integrações
3. Configurar secrets:
   ```
   ASAAS_API_KEY=xxx
   ASAAS_ENVIRONMENT=sandbox  # ou production
   ```

4. Modificar `POST /api/payments` em `src/worker/index.ts`:

```typescript
// PIX
const response = await fetch(
  'https://sandbox.asaas.com/api/v3/pix/qrCodes/static',
  {
    method: 'POST',
    headers: {
      'access_token': env.ASAAS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      addressKey: 'sua-chave-pix',
      value: amount,
      description: `Pagamento caso ${case_id}`,
      expirationDate: due_date
    })
  }
);

// Boleto
const response = await fetch(
  'https://sandbox.asaas.com/api/v3/payments',
  {
    method: 'POST',
    headers: {
      'access_token': env.ASAAS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customer: customer_asaas_id,
      billingType: 'BOLETO',
      value: amount,
      dueDate: due_date,
      description: `Pagamento caso ${case_id}`
    })
  }
);
```

5. Configurar webhook do Asaas para:
   ```
   https://seudominio.com/api/payments/webhook
   ```

### 3. Integração CRM/ERP (Opcional)

O sistema está preparado para receber dados via:
- `POST /api/cases/import` (JSON)
- `POST /api/consent/bulk` (consentimentos em lote)
- Webhooks customizados configuráveis em Integrações

---

## Deploy em Produção

### Cloudflare (Recomendado)

```bash
# 1. Build do frontend
npm run build

# 2. Deploy
wrangler deploy

# 3. Configurar domínio customizado
wrangler domains add seudominio.com.br
```

### Variáveis de Produção

No dashboard Cloudflare > Workers > Settings > Variables:

```
MOCHA_USERS_SERVICE_API_URL = https://users.getmocha.com
MOCHA_USERS_SERVICE_API_KEY = [secret]
WHATSAPP_TOKEN = [secret]
WHATSAPP_PHONE_ID = xxx
BANK_API_KEY = [secret]
```

---

## Migração para Outro Ambiente

### Opção 1: Manter Cloudflare (mais fácil)

1. Criar conta Cloudflare própria
2. Criar banco D1
3. Executar migrações
4. Configurar secrets
5. Deploy via `wrangler deploy`

### Opção 2: Migrar para Node.js + PostgreSQL

**Backend:**
1. Substituir Hono por Express/Fastify
2. Substituir D1 por PostgreSQL (via Prisma ou Drizzle)
3. Adaptar bindings de ambiente para process.env

**Frontend:**
1. Funciona sem alterações
2. Fazer build e hospedar em qualquer CDN

**Alterações necessárias no backend:**

```typescript
// De (Cloudflare Worker):
export default app;

// Para (Node.js):
import express from 'express';
const app = express();
app.listen(3000);
```

```typescript
// De (D1):
const { results } = await c.env.DB.prepare(query).bind(...params).all();

// Para (PostgreSQL com Drizzle):
const results = await db.select().from(cases).where(...);
```

---

## Checklist de Produção

- [ ] Configurar domínio customizado
- [ ] Obter credenciais WhatsApp Business API
- [ ] Escolher e configurar provedor bancário
- [ ] Testar fluxo completo em sandbox
- [ ] Configurar webhooks de callback
- [ ] Revisar permissões e roles
- [ ] Configurar alertas de monitoramento
- [ ] Fazer backup da configuração
- [ ] Treinar equipe operacional

---

## Suporte

Para dúvidas sobre o código, consulte os comentários inline em:
- `src/worker/index.ts` - Toda a API documentada
- `src/react-app/pages/` - Lógica de cada tela

---

*Documentação gerada em: Julho 2025*
*Versão: 1.0.0*
