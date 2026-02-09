# Soul Collect - Documentação Técnica para Desenvolvedores

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Configuração do Ambiente](#configuração-do-ambiente)
5. [Banco de Dados](#banco-de-dados)
6. [APIs Backend](#apis-backend)
7. [Frontend React](#frontend-react)
8. [Autenticação](#autenticação)
9. [Integrações Externas](#integrações-externas)
10. [Deploy e Publicação](#deploy-e-publicação)

---

## 🎯 Visão Geral

**Soul Collect** é uma plataforma de gestão de cobrança com recursos de:
- Gestão de casos/devedores
- Automação de jornadas de cobrança
- Integração WhatsApp
- Geração de PIX e Boletos
- Gestão de consentimento LGPD
- Supervisão e alertas de risco
- Dashboard analítico
- Integrações com ERPs (SAP B1, Beta)

**URL de Produção:** https://soulcollect.mocha.app

---

## 🛠️ Stack Tecnológica

### Backend
- **Runtime:** Cloudflare Workers (Edge Computing)
- **Framework:** Hono v4.7.7
- **Banco de Dados:** Cloudflare D1 (SQLite)
- **Autenticação:** @getmocha/users-service (OAuth Google)

### Frontend
- **Framework:** React 19
- **Roteamento:** React Router v7
- **Estilização:** Tailwind CSS v3
- **Gráficos:** Recharts v3
- **Ícones:** Lucide React
- **Build:** Vite v7

### Linguagem
- **TypeScript 5.8**

---

## 📁 Estrutura do Projeto

```
soul-collect/
├── docs/                           # Documentação
│   ├── DOCUMENTACAO-DESENVOLVEDOR.md
│   ├── GUIA-INTEGRACAO.md
│   ├── README-TECNICO.md
│   └── todo.md
│
├── src/
│   ├── data/                       # Dados estáticos
│   │   ├── caseDetails.ts
│   │   ├── cases.ts
│   │   ├── dashboard.ts
│   │   └── knowledgeBase.ts
│   │
│   ├── react-app/                  # Frontend React
│   │   ├── components/             # Componentes reutilizáveis
│   │   │   ├── AIChat.tsx
│   │   │   ├── AlertsList.tsx
│   │   │   ├── CaseCard.tsx
│   │   │   ├── CaseFilters.tsx
│   │   │   ├── CaseTimeline.tsx
│   │   │   ├── ConsentCard.tsx
│   │   │   ├── CopilotSuggestions.tsx
│   │   │   ├── DashboardConfigModal.tsx
│   │   │   ├── FunnelChart.tsx
│   │   │   ├── IntegrationConfigModal.tsx
│   │   │   ├── KnowledgeBase.tsx
│   │   │   ├── KPICard.tsx
│   │   │   ├── NewIntegrationModal.tsx
│   │   │   ├── PaymentModal.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── RecoveryPieChart.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TimeSeriesChart.tsx
│   │   │   └── WhatsAppModal.tsx
│   │   │
│   │   ├── hooks/                  # Custom Hooks
│   │   │   ├── useAuditLogs.ts
│   │   │   ├── useCases.ts
│   │   │   ├── useCurrentUser.tsx
│   │   │   ├── useJourneys.ts
│   │   │   └── useUsers.ts
│   │   │
│   │   ├── pages/                  # Páginas/Views
│   │   │   ├── AdminDatabase.tsx   # Visualizador de banco
│   │   │   ├── Agents.tsx          # Agentes IA
│   │   │   ├── ApiDocs.tsx         # Documentação API
│   │   │   ├── AuthCallback.tsx    # Callback OAuth
│   │   │   ├── CaseDetail.tsx      # Detalhe do caso
│   │   │   ├── Cases.tsx           # Lista de casos
│   │   │   ├── Consent.tsx         # Gestão LGPD
│   │   │   ├── Home.tsx            # Dashboard principal
│   │   │   ├── Integrations.tsx    # Integrações
│   │   │   ├── Journey.tsx         # Jornadas
│   │   │   ├── LandingPage.tsx     # Página pública
│   │   │   ├── LoginGate.tsx       # Gate de autenticação
│   │   │   ├── LoginGoogle.tsx     # Login Google
│   │   │   ├── Logs.tsx            # Logs de auditoria
│   │   │   ├── Settings.tsx        # Configurações
│   │   │   ├── Supervisor.tsx      # Painel supervisor
│   │   │   ├── Users.tsx           # Gestão usuários
│   │   │   └── ValidateCorporateEmail.tsx
│   │   │
│   │   ├── App.tsx                 # Componente raiz
│   │   ├── index.css               # Estilos globais
│   │   ├── main.tsx                # Entry point
│   │   └── vite-env.d.ts
│   │
│   ├── shared/
│   │   └── types.ts                # Tipos compartilhados
│   │
│   └── worker/
│       └── index.ts                # Backend Hono (API)
│
├── index.html                      # HTML base
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── wrangler.json                   # Config Cloudflare
```

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Cloudflare (para deploy)

### Instalação Local

```bash
# Clonar/baixar o projeto
cd soul-collect

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:5173`

### Scripts Disponíveis

```bash
npm run dev       # Inicia servidor de desenvolvimento
npm run build     # Build de produção
npm run check     # Verifica TypeScript e build
npm run lint      # Executa ESLint
npm run knip      # Verifica código não utilizado
```

### Variáveis de Ambiente

O projeto usa as seguintes variáveis injetadas pelo Mocha:

| Variável | Descrição |
|----------|-----------|
| `MOCHA_USERS_SERVICE_API_URL` | URL do serviço de autenticação |
| `MOCHA_USERS_SERVICE_API_KEY` | Chave API do serviço de auth |

---

## 🗄️ Banco de Dados

### Visão Geral
- **Tipo:** SQLite via Cloudflare D1
- **Binding:** `env.DB`

### Tabelas Principais

#### `app_users` - Usuários do Sistema
```sql
id, mocha_user_id, email, name, avatar_url, role_id, status, 
is_mfa_enabled, last_active_at, login_count, invited_by_id, 
invited_at, is_owner, corporate_email, created_at, updated_at
```

#### `cases` - Casos de Cobrança
```sql
id, case_number, customer_name, customer_document, customer_phone, 
customer_email, contract_id, contract_type, total_debt, days_overdue, 
status, last_contact_channel, last_contact_at, next_action_at, 
assigned_operator_id, assigned_operator_name, risk_score, has_consent, 
installments_overdue, total_installments, notes, created_at, updated_at
```

**Status possíveis:** `new`, `contacted`, `negotiating`, `promised`, `paid`, `defaulted`, `paused`, `closed`

#### `case_timeline` - Timeline de Eventos
```sql
id, case_id, event_type, title, description, channel, user_id, 
user_name, metadata, created_at
```

#### `payments` - Pagamentos (PIX/Boleto)
```sql
id, case_id, payment_type, amount, status, due_date, paid_at, 
pix_code, pix_qr_data, boleto_barcode, boleto_line, boleto_bank, 
external_id, metadata, created_at, updated_at
```

#### `journeys` - Jornadas de Cobrança
```sql
id, name, description, status, trigger_conditions, cases_active, 
conversion_rate, created_by_id, created_at, updated_at
```

#### `journey_steps` - Passos das Jornadas
```sql
id, journey_id, step_order, day_offset, channel, action_type, 
action_title, template_content, conditions, is_active, created_at, updated_at
```

#### `consent_records` - Consentimentos LGPD
```sql
id, case_id, customer_document, customer_name, customer_email, 
customer_phone, consent_type_id, status, granted_at, revoked_at, 
expires_at, collection_method, collection_channel, ip_address, 
user_agent, proof_url, notes, collected_by_id, collected_by_name, 
created_at, updated_at
```

#### `risk_alerts` - Alertas de Risco
```sql
id, case_id, alert_type, severity, title, description, risk_score, 
is_acknowledged, acknowledged_by_id, acknowledged_at, is_resolved, 
resolved_by_id, resolved_at, resolution_notes, auto_generated, 
metadata, created_at, updated_at
```

#### `integrations` - Integrações Externas
```sql
id, name, type, category, config, credentials, status, last_sync_at, 
sync_interval, stats_today, stats_month, stats_errors, success_rate, 
environment, created_at, updated_at
```

### Outras Tabelas
- `roles` - Perfis de usuário
- `permissions` - Permissões
- `role_permissions` - Associação role-permission
- `audit_logs` - Logs de auditoria
- `case_installments` - Parcelas
- `whatsapp_messages` - Mensagens WhatsApp
- `whatsapp_templates` - Templates WhatsApp
- `webhook_endpoints` - Endpoints webhook
- `webhook_logs` - Logs de webhook
- `supervisor_actions` - Ações do supervisor
- `risk_rules` - Regras de risco
- `consent_types` - Tipos de consentimento
- `consent_history` - Histórico de consentimentos
- `app_settings` - Configurações do app
- `invite_tokens` - Tokens de convite
- `dashboard_config` - Configurações do dashboard

---

## 🔌 APIs Backend

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/oauth/google/redirect_url` | URL de redirect OAuth |
| POST | `/api/sessions` | Troca code por token |
| GET | `/api/users/me` | Usuário atual |
| GET | `/api/logout` | Logout |

### Casos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/cases` | Listar casos |
| GET | `/api/cases/stats` | Estatísticas |
| GET | `/api/cases/:id` | Detalhe do caso |
| POST | `/api/cases` | Criar caso |
| PUT | `/api/cases/:id` | Atualizar caso |
| DELETE | `/api/cases/:id` | Deletar caso |
| POST | `/api/cases/:id/timeline` | Adicionar evento |
| GET | `/api/cases/export` | Exportar CSV |
| POST | `/api/cases/import` | Importar casos |

### Pagamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/payments` | Gerar PIX/Boleto |
| GET | `/api/cases/:id/payments` | Pagamentos do caso |
| GET | `/api/payments/:id` | Detalhe pagamento |
| PUT | `/api/payments/:id` | Atualizar status |

### Jornadas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/journeys` | Listar jornadas |
| GET | `/api/journeys/:id` | Detalhe jornada |
| POST | `/api/journeys` | Criar jornada |
| PUT | `/api/journeys/:id` | Atualizar jornada |
| DELETE | `/api/journeys/:id` | Deletar jornada |
| POST | `/api/journeys/:id/toggle` | Ativar/pausar |

### WhatsApp

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/whatsapp/templates` | Templates |
| POST | `/api/whatsapp/send` | Enviar mensagem |
| GET | `/api/cases/:id/whatsapp` | Histórico |
| POST | `/api/whatsapp/webhook` | Webhook Meta |

### Supervisor/Alertas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/risk-alerts` | Listar alertas |
| GET | `/api/supervisor/stats` | Estatísticas |
| POST | `/api/risk-alerts/:id/acknowledge` | Reconhecer |
| POST | `/api/risk-alerts/:id/resolve` | Resolver |
| POST | `/api/supervisor/run-detection` | Executar detecção |

### LGPD/Consent

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/consent/types` | Tipos de consentimento |
| GET | `/api/cases/:id/consents` | Consentimentos do caso |
| POST | `/api/consent` | Registrar consentimento |
| POST | `/api/consent/:id/revoke` | Revogar |
| GET | `/api/consent/export/:document` | Portabilidade |

### Integrações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/integrations` | Listar integrações |
| POST | `/api/integrations` | Criar integração |
| PUT | `/api/integrations/:id` | Atualizar |
| POST | `/api/integrations/:id/test` | Testar conexão |
| POST | `/api/integrations/:id/sync` | Sincronizar |

### APIs Externas (para ERPs)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/external/sap/invoices` | SAP B1 - Enviar faturas |
| GET | `/api/external/sap/payments` | SAP B1 - Obter pagamentos |
| POST | `/api/external/beta/customers` | Beta - Enviar clientes |
| GET | `/api/external/beta/cases` | Beta - Obter casos |
| POST | `/api/external/beta/webhook` | Beta - Webhook |

### Admin

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/admin/users` | Listar usuários |
| POST | `/api/admin/users/invite` | Convidar usuário |
| PUT | `/api/admin/users/:id` | Atualizar usuário |
| DELETE | `/api/admin/users/:id` | Deletar usuário |
| GET | `/api/admin/roles` | Listar roles |
| GET | `/api/admin/audit-logs` | Logs de auditoria |

---

## ⚛️ Frontend React

### Estrutura de Páginas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | LandingPage | Página pública |
| `/login` | LoginGoogle | Login OAuth |
| `/app` | Home | Dashboard |
| `/app/cases` | Cases | Lista de casos |
| `/app/cases/:id` | CaseDetail | Detalhe do caso |
| `/app/journey` | Journey | Jornadas |
| `/app/integrations` | Integrations | Integrações |
| `/app/supervisor` | Supervisor | Painel supervisor |
| `/app/consent` | Consent | LGPD |
| `/app/users` | Users | Gestão usuários |
| `/app/settings` | Settings | Configurações |
| `/app/logs` | Logs | Auditoria |
| `/app/agents` | Agents | Agentes IA |
| `/app/api-docs` | ApiDocs | Documentação API |
| `/app/admin/database` | AdminDatabase | Visualizar banco |

### Hooks Customizados

```typescript
// useCurrentUser.tsx - Contexto do usuário atual
const { user, appUser, isLoading, hasPermission } = useCurrentUser();

// useCases.ts - Operações com casos
const { cases, loading, createCase, updateCase, deleteCase } = useCases();

// useJourneys.ts - Operações com jornadas
const { journeys, createJourney, updateJourney, toggleJourney } = useJourneys();

// useUsers.ts - Gestão de usuários
const { users, inviteUser, updateUser, deleteUser } = useUsers();

// useAuditLogs.ts - Logs de auditoria
const { logs, loading, refetch } = useAuditLogs();
```

### Componentes Principais

```typescript
// Sidebar.tsx - Menu lateral com navegação
// KPICard.tsx - Card de KPI do dashboard
// CaseCard.tsx - Card de caso
// CaseTimeline.tsx - Timeline de eventos
// PaymentModal.tsx - Modal para gerar PIX/Boleto
// WhatsAppModal.tsx - Modal para enviar WhatsApp
// AIChat.tsx - Chat com IA copiloto
// AlertsList.tsx - Lista de alertas
// ConsentCard.tsx - Card de consentimento
```

---

## 🔐 Autenticação

### Fluxo OAuth Google

1. Usuário clica em "Entrar com Google"
2. Frontend chama `GET /api/oauth/google/redirect_url`
3. Usuário é redirecionado para Google
4. Google retorna com `code` para `/auth/callback`
5. Frontend chama `POST /api/sessions` com o code
6. Backend troca code por token e seta cookie
7. Frontend chama `GET /api/users/me` para obter dados

### Controle de Acesso

```typescript
// Super Admin (owner)
const SUPER_ADMIN_EMAIL = 'fabianoeyes18@gmail.com';

// Roles disponíveis
// 1 - Administrador
// 2 - Supervisor  
// 3 - Operador
// 4 - Visualizador

// Verificar permissão
const hasAccess = appUser.permissions.includes('cases.edit');
```

### Convites

Usuários são pré-autorizados via convite:
1. Admin cria convite com email e role
2. Link de convite é gerado
3. Usuário acessa link e faz login Google
4. Sistema valida e associa a conta

---

## 🔗 Integrações Externas

### SAP Business One

**Endpoint:** `POST /api/external/sap/invoices`

```json
{
  "invoices": [{
    "doc_entry": "12345",
    "card_name": "João Silva",
    "tax_id": "123.456.789-00",
    "doc_total": 5000.00,
    "days_overdue": 30,
    "phone": "11999998888",
    "email": "joao@email.com"
  }]
}
```

### ERP Beta (Prospera)

**Endpoint Webhook:** `POST /api/external/beta/webhook`

```json
{
  "event": "customer.created",
  "timestamp": "2026-02-02T12:00:00Z",
  "data": {
    "customers": [{
      "id_beta": "12345",
      "nome": "João Silva",
      "cpf": "123.456.789-00",
      "telefone": "11999998888",
      "valor_divida": 5000.00,
      "dias_atraso": 30
    }]
  }
}
```

**Autenticação:** Header `X-API-Key`

**API Key Beta:** `sk_beta_SoulCollect2026_X7kM9pLqR3nW5vJ8`

---

## 🚀 Deploy e Publicação

### Via Mocha (Recomendado)

O projeto foi desenvolvido na plataforma Mocha. Para publicar:

1. Acesse o editor Mocha
2. Clique em "Publish" no canto superior direito
3. O app será deployed automaticamente

### Manual via Wrangler

```bash
# Build
npm run build

# Deploy
npx wrangler deploy
```

### Configuração Cloudflare

O arquivo `wrangler.json` contém:
- Nome do worker
- Binding do D1 database
- Configurações de compatibilidade

---

## 📊 Monitoramento

### Logs de Auditoria

Todas as ações importantes são logadas em `audit_logs`:
- Login de usuários
- Criação/edição de casos
- Alterações de permissões
- Operações de integração

### Métricas do Dashboard

O endpoint `/api/dashboard/enhanced-stats` retorna:
- Carteira total
- Valor em inadimplência
- Valor recuperado
- Taxa de contato
- Taxa de conversão
- Metas e progresso

---

## 📞 Suporte

- **Email:** fabianoeyes18@gmail.com
- **Documentação API:** https://soulcollect.mocha.app/app/api-docs

---

**Versão:** 1.0.0  
**Última atualização:** Fevereiro 2026
