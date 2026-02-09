# Soul Collect - Guia de Integração

Este guia detalha como integrar os serviços externos para tornar o sistema totalmente operacional.

---

## 1. WhatsApp Business API

### Pré-requisitos
- CNPJ válido e empresa verificada
- Conta Meta Business verificada
- Número de telefone exclusivo para WhatsApp Business

### Passo a Passo

#### 1.1 Criar Conta Meta Business
1. Acesse https://business.facebook.com
2. Crie uma conta business com seu CNPJ
3. Complete a verificação da empresa (pode levar 1-3 dias)

#### 1.2 Criar App no Meta for Developers
1. Acesse https://developers.facebook.com
2. Clique em "Criar App"
3. Escolha "Empresa" como tipo
4. Selecione sua conta business
5. Adicione o produto "WhatsApp"

#### 1.3 Configurar WhatsApp Business API
1. Em WhatsApp > Primeiros Passos, adicione um número de teste
2. Anote o **Phone Number ID** e **WhatsApp Business Account ID**
3. Gere um **Access Token** permanente:
   - Vá em Configurações do App > Tokens de Acesso
   - Crie um System User
   - Gere token com permissões: `whatsapp_business_management`, `whatsapp_business_messaging`

#### 1.4 Configurar Webhook
1. Em WhatsApp > Configuração, clique em "Editar" no Webhook
2. URL do callback:
   ```
   https://seudominio.com/api/whatsapp/webhook
   ```
3. Token de verificação: crie uma string aleatória (ex: `soulcollect_verify_2024`)
4. Inscreva-se nos campos:
   - `messages`
   - `message_status`

#### 1.5 Criar Templates de Mensagem
Templates precisam ser aprovados pela Meta (24-48h).

**Template de Cobrança (exemplo):**
```
Nome: cobranca_inicial
Categoria: UTILITY
Idioma: pt_BR
Conteúdo:
  Olá {{1}}, identificamos uma pendência em seu nome no valor de R$ {{2}}.
  
  Para regularizar, acesse: {{3}}
  
  Em caso de dúvidas, responda esta mensagem.
```

#### 1.6 Variáveis de Ambiente
```env
WHATSAPP_TOKEN=EAAxxxxxxx...
WHATSAPP_PHONE_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=soulcollect_verify_2024
WHATSAPP_BUSINESS_ID=987654321098765
```

#### 1.7 Código de Envio (já preparado)

O endpoint `/api/whatsapp/send` está pronto. Substitua o mock:

```typescript
// Localização: src/worker/index.ts
// Procure por: app.post("/api/whatsapp/send"

// Substitua esta linha:
const whatsappMessageId = generateWhatsAppMessageId();

// Por este código:
const whatsappResponse = await fetch(
  `https://graph.facebook.com/v18.0/${c.env.WHATSAPP_PHONE_ID}/messages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${c.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone_number.replace(/\D/g, ''), // Apenas números
      type: template_name ? 'template' : 'text',
      ...(template_name ? {
        template: {
          name: template_name,
          language: { code: 'pt_BR' },
          components: variables ? [{
            type: 'body',
            parameters: variables.map((v: string) => ({ type: 'text', text: v }))
          }] : []
        }
      } : {
        text: { body: content }
      })
    })
  }
);

if (!whatsappResponse.ok) {
  const error = await whatsappResponse.json();
  return c.json({ error: 'Falha ao enviar WhatsApp', details: error }, 500);
}

const whatsappData = await whatsappResponse.json();
const whatsappMessageId = whatsappData.messages[0].id;
```

---

## 2. Integração Bancária

### Opção A: Asaas (Recomendado para Cobrança)

#### 2.1 Criar Conta
1. Acesse https://www.asaas.com
2. Crie conta com CNPJ
3. Complete verificação (KYC)
4. Obtenha API Key em: Configurações > Integrações > API

#### 2.2 Variáveis de Ambiente
```env
ASAAS_API_KEY=$aact_xxxxxxxx
ASAAS_ENVIRONMENT=sandbox  # Mudar para 'production' em produção
```

#### 2.3 Código de Geração de PIX

```typescript
// Localização: src/worker/index.ts
// Procure por: app.post("/api/payments"

// Adicione no início do arquivo:
const ASAAS_BASE_URL = (env: Env) => 
  env.ASAAS_ENVIRONMENT === 'production' 
    ? 'https://www.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';

// Dentro do endpoint, substitua a geração mock por:
if (payment_type === 'pix') {
  // Primeiro, garantir que o cliente existe no Asaas
  let asaasCustomerId = caseData.asaas_customer_id;
  
  if (!asaasCustomerId) {
    // Criar cliente no Asaas
    const customerResponse = await fetch(`${ASAAS_BASE_URL(c.env)}/customers`, {
      method: 'POST',
      headers: {
        'access_token': c.env.ASAAS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: caseData.customer_name,
        cpfCnpj: caseData.customer_document?.replace(/\D/g, ''),
        email: caseData.customer_email,
        phone: caseData.customer_phone?.replace(/\D/g, ''),
        externalReference: `case_${case_id}`
      })
    });
    
    const customerData = await customerResponse.json();
    asaasCustomerId = customerData.id;
    
    // Salvar ID do cliente no caso
    await c.env.DB.prepare(
      "UPDATE cases SET asaas_customer_id = ? WHERE id = ?"
    ).bind(asaasCustomerId, case_id).run();
  }
  
  // Criar cobrança PIX
  const paymentResponse = await fetch(`${ASAAS_BASE_URL(c.env)}/payments`, {
    method: 'POST',
    headers: {
      'access_token': c.env.ASAAS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customer: asaasCustomerId,
      billingType: 'PIX',
      value: amount,
      dueDate: due_date || new Date().toISOString().split('T')[0],
      description: `Pagamento caso ${caseData.case_number}`,
      externalReference: `payment_${case_id}_${Date.now()}`
    })
  });
  
  const paymentData = await paymentResponse.json();
  
  // Buscar QR Code
  const pixResponse = await fetch(
    `${ASAAS_BASE_URL(c.env)}/payments/${paymentData.id}/pixQrCode`,
    {
      headers: { 'access_token': c.env.ASAAS_API_KEY }
    }
  );
  
  const pixData = await pixResponse.json();
  
  pixCode = pixData.payload; // Código copia e cola
  pixQrData = pixData.encodedImage; // Base64 da imagem QR
  externalId = paymentData.id;
}
```

#### 2.4 Código de Geração de Boleto

```typescript
// Similar ao PIX, mas com billingType: 'BOLETO'
if (payment_type === 'boleto') {
  const paymentResponse = await fetch(`${ASAAS_BASE_URL(c.env)}/payments`, {
    method: 'POST',
    headers: {
      'access_token': c.env.ASAAS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customer: asaasCustomerId,
      billingType: 'BOLETO',
      value: amount,
      dueDate: due_date,
      description: `Pagamento caso ${caseData.case_number}`,
      externalReference: `payment_${case_id}_${Date.now()}`,
      fine: { value: 2 }, // Multa 2%
      interest: { value: 1 } // Juros 1% ao mês
    })
  });
  
  const paymentData = await paymentResponse.json();
  
  boletoBarcode = paymentData.nossoNumero;
  boletoLine = paymentData.identificationField; // Linha digitável
  boletoBank = 'Asaas';
  externalId = paymentData.id;
}
```

#### 2.5 Webhook de Confirmação

Configurar no Asaas: Configurações > Integrações > Webhooks

URL: `https://seudominio.com/api/payments/webhook`

Adicionar endpoint:

```typescript
// Adicionar em src/worker/index.ts
app.post("/api/payments/webhook", async (c) => {
  const body = await c.req.json();
  
  // Asaas envia evento como: { event: "PAYMENT_CONFIRMED", payment: {...} }
  const { event, payment } = body;
  
  if (!payment?.externalReference) {
    return c.json({ received: true });
  }
  
  // Extrair case_id do externalReference
  const match = payment.externalReference.match(/payment_(\d+)_/);
  if (!match) {
    return c.json({ received: true });
  }
  
  const caseId = match[1];
  
  // Atualizar status do pagamento
  let newStatus = 'pending';
  if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
    newStatus = 'paid';
  } else if (event === 'PAYMENT_OVERDUE') {
    newStatus = 'expired';
  } else if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED') {
    newStatus = 'cancelled';
  }
  
  await c.env.DB.prepare(`
    UPDATE payments SET 
      status = ?,
      paid_at = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE external_id = ?
  `).bind(
    newStatus,
    newStatus === 'paid' ? new Date().toISOString() : null,
    payment.id
  ).run();
  
  // Adicionar timeline
  if (newStatus === 'paid') {
    await c.env.DB.prepare(`
      INSERT INTO case_timeline (case_id, event_type, title, description, channel, user_name)
      VALUES (?, 'payment', 'Pagamento Confirmado', ?, ?, 'Sistema')
    `).bind(
      caseId,
      `Pagamento de R$ ${payment.value.toFixed(2)} confirmado via ${payment.billingType}`,
      payment.billingType.toLowerCase()
    ).run();
    
    // Atualizar status do caso se for pagamento total
    await c.env.DB.prepare(`
      UPDATE cases SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(caseId).run();
  }
  
  return c.json({ received: true, processed: event });
});
```

### Opção B: Stripe (Internacional)

Similar ao Asaas, mas usando Stripe Checkout:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

// Criar Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100), // Centavos
  currency: 'brl',
  payment_method_types: ['pix'],
  metadata: { case_id: case_id.toString() }
});
```

---

## 3. Importação de Dados do ERP

### Formato de Importação de Casos

Endpoint: `POST /api/cases/import`

```json
{
  "cases": [
    {
      "customer_name": "João da Silva",
      "customer_document": "123.456.789-00",
      "customer_phone": "(11) 99999-9999",
      "customer_email": "joao@email.com",
      "contract_id": "CONT-001",
      "contract_type": "Empréstimo Pessoal",
      "total_debt": 5000.00,
      "days_overdue": 45,
      "status": "new",
      "notes": "Cliente preferencial"
    }
  ]
}
```

### Formato de Importação de Consentimentos

Endpoint: `POST /api/consent/bulk`

```json
{
  "records": [
    {
      "customer_document": "123.456.789-00",
      "consent_type_id": 1,
      "status": "granted",
      "collection_method": "import",
      "collection_channel": "crm"
    }
  ]
}
```

### Integração via Webhook

Configure webhooks saindo do seu ERP para:
- `POST /api/cases` - Novo caso
- `PUT /api/cases/:id` - Atualização
- `POST /api/consent` - Registro de consentimento

---

## 4. Testes

### Ambiente Sandbox

Todos os provedores oferecem sandbox:
- **WhatsApp**: Use o número de teste fornecido pelo Meta
- **Asaas**: Prefix `sandbox.asaas.com`
- **Stripe**: Use chaves `sk_test_`

### Simulação no Sistema

O sistema tem endpoints de simulação:
- `POST /api/payments/:id/simulate-callback` - Simular pagamento
- `POST /api/whatsapp/simulate-incoming` - Simular mensagem recebida
- `POST /api/whatsapp/messages/:id/simulate-status` - Simular status

---

## 5. Checklist de Go-Live

### WhatsApp
- [ ] Conta Business verificada
- [ ] Número de produção configurado
- [ ] Templates aprovados
- [ ] Webhook funcionando
- [ ] Teste de envio OK
- [ ] Teste de recebimento OK

### Pagamentos
- [ ] Conta de produção aprovada
- [ ] Chave PIX cadastrada
- [ ] Webhook configurado
- [ ] Teste PIX OK
- [ ] Teste Boleto OK
- [ ] Teste de confirmação OK

### Sistema
- [ ] Domínio customizado configurado
- [ ] SSL funcionando
- [ ] Secrets de produção configurados
- [ ] Backup de banco configurado
- [ ] Monitoramento ativo
- [ ] Equipe treinada

---

## Suporte

- **Meta Business Help**: https://www.facebook.com/business/help
- **Asaas Documentação**: https://docs.asaas.com
- **Stripe Docs**: https://stripe.com/docs

Para dúvidas do código, consulte `docs/README-TECNICO.md`.
