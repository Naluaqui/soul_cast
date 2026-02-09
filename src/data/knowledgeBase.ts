export interface Document {
  id: string;
  title: string;
  category: 'policy' | 'script' | 'faq' | 'lgpd' | 'negotiation';
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
  status: 'active' | 'draft' | 'archived';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
  actions?: SuggestedAction[];
}

export interface DocumentSource {
  documentId: string;
  documentTitle: string;
  excerpt: string;
  relevance: number;
}

export interface SuggestedAction {
  type: 'send_message' | 'propose_deal' | 'generate_boleto' | 'escalate' | 'pause';
  label: string;
  data?: any;
}

export const documentCategories = {
  policy: { label: 'Políticas', color: 'bg-blue-100 text-blue-700' },
  script: { label: 'Scripts', color: 'bg-green-100 text-green-700' },
  faq: { label: 'FAQs', color: 'bg-purple-100 text-purple-700' },
  lgpd: { label: 'LGPD', color: 'bg-red-100 text-red-700' },
  negotiation: { label: 'Negociação', color: 'bg-orange-100 text-orange-700' }
};

export const mockDocuments: Document[] = [
  {
    id: 'DOC-001',
    title: 'Política de Cobrança - Regras Gerais',
    category: 'policy',
    content: `# Política de Cobrança

## Princípios Gerais
1. Toda comunicação deve ser respeitosa e profissional
2. Respeitar horários de contato: 8h às 20h em dias úteis, 8h às 14h aos sábados
3. Nunca ameaçar ou constranger o cliente
4. Sempre oferecer alternativas de pagamento

## Frequência de Contato
- D+1 a D+7: máximo 1 contato por dia
- D+8 a D+30: máximo 1 contato a cada 2 dias
- D+31 em diante: máximo 2 contatos por semana

## Canais Preferenciais
1. WhatsApp (com consentimento)
2. E-mail
3. SMS
4. Telefone (último recurso)`,
    tags: ['cobrança', 'regras', 'frequência', 'contato'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01'),
    version: 3,
    status: 'active'
  },
  {
    id: 'DOC-002',
    title: 'Scripts de Negociação - Primeira Inadimplência',
    category: 'script',
    content: `# Scripts - Primeira Inadimplência

## Abordagem Inicial (WhatsApp)
"Olá {nome}! Aqui é da {empresa}. Notamos que a parcela de {valor} venceu em {data}. Sabemos que imprevistos acontecem. Podemos ajudar você a regularizar?"

## Após Resposta Positiva
"Ótimo! Temos algumas opções:
1. Pagamento à vista com {desconto}% de desconto
2. Parcelamento em até {parcelas}x
3. Reagendamento para {nova_data}

Qual opção funciona melhor para você?"

## Cliente Alega Dificuldade Financeira
"Entendo sua situação. Vamos encontrar uma solução juntos. Qual valor você conseguiria pagar mensalmente?"`,
    tags: ['script', 'primeira inadimplência', 'negociação', 'whatsapp'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-05-15'),
    version: 2,
    status: 'active'
  },
  {
    id: 'DOC-003',
    title: 'LGPD - Guia de Consentimento',
    category: 'lgpd',
    content: `# Guia de Consentimento LGPD

## O que é Consentimento
Manifestação livre, informada e inequívoca do titular concordando com o tratamento de seus dados.

## Requisitos Válidos
- Deve ser específico (para cada finalidade)
- Deve ser dado de forma ativa (não pré-marcado)
- Deve poder ser revogado a qualquer momento
- Deve ser documentado com data/hora

## Opt-Out
- Cliente pode solicitar a qualquer momento
- Suspensão imediata de comunicações
- Manter registro de 5 anos
- Não impede cobrança judicial

## Frases Proibidas
- "Se não pagar, vamos divulgar seu nome"
- "Vamos ligar para sua família"
- Qualquer ameaça ou constrangimento`,
    tags: ['lgpd', 'consentimento', 'opt-out', 'compliance'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-03-20'),
    version: 4,
    status: 'active'
  },
  {
    id: 'DOC-004',
    title: 'Tabela de Descontos e Condições',
    category: 'negotiation',
    content: `# Tabela de Descontos

## Por Tempo de Atraso
| Atraso | Desconto Máximo | Parcelas |
|--------|-----------------|----------|
| D+1-7  | 5%              | 3x       |
| D+8-30 | 10%             | 6x       |
| D+31-60| 15%             | 12x      |
| D+61+  | 20%             | 18x      |

## Por Valor da Dívida
- Até R$ 1.000: desconto adicional de 5%
- R$ 1.001 - R$ 5.000: tabela padrão
- Acima de R$ 5.000: requer aprovação gerencial

## Condições Especiais
- Bom pagador histórico: +5% desconto
- Primeira inadimplência: +3% desconto
- Pagamento via Pix: +2% desconto`,
    tags: ['desconto', 'negociação', 'tabela', 'condições'],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-06-10'),
    version: 5,
    status: 'active'
  },
  {
    id: 'DOC-005',
    title: 'FAQ - Perguntas Frequentes dos Clientes',
    category: 'faq',
    content: `# FAQ - Perguntas Frequentes

## "Por que estou recebendo cobrança?"
"Identificamos uma pendência em seu contrato {contrato}. A parcela {parcela} no valor de {valor} venceu em {data}."

## "Já paguei essa parcela"
"Vou verificar. Pode me enviar o comprovante? O prazo de baixa é de até 3 dias úteis."

## "Não reconheço essa dívida"
"Vou abrir uma solicitação de análise. Enquanto isso, a cobrança fica suspensa. Prazo: 5 dias úteis."

## "Quero renegociar"
"Claro! Temos opções de parcelamento e desconto. Qual é sua situação atual?"

## "Não quero mais receber mensagens"
"Entendo. Vou registrar sua solicitação de opt-out. Você não receberá mais comunicações por este canal."`,
    tags: ['faq', 'perguntas', 'respostas', 'cliente'],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-05-01'),
    version: 3,
    status: 'active'
  }
];

export const mockChatHistory: ChatMessage[] = [
  {
    id: 'MSG-001',
    role: 'system',
    content: 'Bem-vindo ao Copilot Soul Collect! Sou seu assistente de IA para cobrança. Posso ajudar com sugestões de mensagens, análise de casos, propostas de acordo e verificação de compliance.',
    timestamp: new Date('2025-01-07T09:00:00')
  }
];
