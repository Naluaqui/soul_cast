export type EventType = 'message_sent' | 'message_delivered' | 'message_read' | 'message_failed' | 
  'call_made' | 'call_answered' | 'call_missed' | 'payment_received' | 'promise_registered' | 
  'deal_proposed' | 'deal_accepted' | 'deal_rejected' | 'case_escalated' | 'case_paused' | 
  'case_resumed' | 'consent_given' | 'consent_revoked' | 'note_added' | 'boleto_generated' | 'pix_generated';

export interface TimelineEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  channel?: 'whatsapp' | 'sms' | 'email' | 'phone' | 'system';
  operator?: string;
  content?: string;
  metadata?: Record<string, any>;
  status?: 'success' | 'failed' | 'pending';
}

export interface Installment {
  id: string;
  number: number;
  dueDate: Date;
  originalAmount: number;
  currentAmount: number;
  paidAmount: number;
  status: 'paid' | 'overdue' | 'pending' | 'partial';
  paidAt?: Date;
}

export interface CustomerDetail {
  id: string;
  name: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  email: string;
  phone: string;
  alternativePhone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  riskScore: number;
  hasConsent: boolean;
  consentDate?: Date;
  optOutDate?: Date;
  tags: string[];
}

export interface ContractDetail {
  id: string;
  type: string;
  productName: string;
  originalValue: number;
  currentDebt: number;
  interestRate: number;
  penaltyRate: number;
  startDate: Date;
  endDate: Date;
  installmentsTotal: number;
  installmentsPaid: number;
  installmentsOverdue: number;
}

export interface CaseDetailData {
  id: string;
  status: string;
  daysOverdue: number;
  assignedOperator: string;
  journeyId?: string;
  journeyName?: string;
  journeyStep?: number;
  createdAt: Date;
  updatedAt: Date;
  customer: CustomerDetail;
  contract: ContractDetail;
  installments: Installment[];
  timeline: TimelineEvent[];
  notes: string[];
}

export const eventTypeLabels: Record<EventType, string> = {
  message_sent: 'Mensagem Enviada',
  message_delivered: 'Mensagem Entregue',
  message_read: 'Mensagem Lida',
  message_failed: 'Falha no Envio',
  call_made: 'Ligação Realizada',
  call_answered: 'Ligação Atendida',
  call_missed: 'Ligação Não Atendida',
  payment_received: 'Pagamento Recebido',
  promise_registered: 'Promessa Registrada',
  deal_proposed: 'Acordo Proposto',
  deal_accepted: 'Acordo Aceito',
  deal_rejected: 'Acordo Rejeitado',
  case_escalated: 'Caso Escalado',
  case_paused: 'Régua Pausada',
  case_resumed: 'Régua Retomada',
  consent_given: 'Consentimento Dado',
  consent_revoked: 'Consentimento Revogado',
  note_added: 'Nota Adicionada',
  boleto_generated: 'Boleto Gerado',
  pix_generated: 'Pix Gerado'
};

export const eventTypeIcons: Record<EventType, string> = {
  message_sent: '📤',
  message_delivered: '✅',
  message_read: '👁️',
  message_failed: '❌',
  call_made: '📞',
  call_answered: '📞',
  call_missed: '📵',
  payment_received: '💰',
  promise_registered: '🤝',
  deal_proposed: '📋',
  deal_accepted: '✅',
  deal_rejected: '❌',
  case_escalated: '⬆️',
  case_paused: '⏸️',
  case_resumed: '▶️',
  consent_given: '✅',
  consent_revoked: '🚫',
  note_added: '📝',
  boleto_generated: '🧾',
  pix_generated: '💳'
};

// Mock detailed case data
export const mockCaseDetail: CaseDetailData = {
  id: 'CASE-001',
  status: 'negotiating',
  daysOverdue: 15,
  assignedOperator: 'Ana Costa',
  journeyId: 'JRN-001',
  journeyName: 'Régua Padrão - Empréstimo',
  journeyStep: 3,
  createdAt: new Date('2024-12-20'),
  updatedAt: new Date('2025-01-07T10:30:00'),
  customer: {
    id: 'CUST-001',
    name: 'Maria Silva Santos',
    document: '123.456.789-00',
    documentType: 'cpf',
    email: 'maria.santos@email.com',
    phone: '+55 11 99999-1234',
    alternativePhone: '+55 11 98888-5678',
    address: 'Rua das Flores, 123, Apto 45',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    riskScore: 65,
    hasConsent: true,
    consentDate: new Date('2024-06-15'),
    tags: ['Bom Pagador Histórico', 'Primeira Inadimplência']
  },
  contract: {
    id: 'CTR-2024-001',
    type: 'Empréstimo Pessoal',
    productName: 'Crédito Pessoal Plus',
    originalValue: 10000.00,
    currentDebt: 4580.00,
    interestRate: 2.5,
    penaltyRate: 2.0,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2025-06-01'),
    installmentsTotal: 12,
    installmentsPaid: 8,
    installmentsOverdue: 2
  },
  installments: [
    { id: 'INS-001', number: 1, dueDate: new Date('2024-07-01'), originalAmount: 916.67, currentAmount: 916.67, paidAmount: 916.67, status: 'paid', paidAt: new Date('2024-07-01') },
    { id: 'INS-002', number: 2, dueDate: new Date('2024-08-01'), originalAmount: 916.67, currentAmount: 916.67, paidAmount: 916.67, status: 'paid', paidAt: new Date('2024-08-01') },
    { id: 'INS-003', number: 3, dueDate: new Date('2024-09-01'), originalAmount: 916.67, currentAmount: 916.67, paidAmount: 916.67, status: 'paid', paidAt: new Date('2024-09-02') },
    { id: 'INS-004', number: 4, dueDate: new Date('2024-10-01'), originalAmount: 916.67, currentAmount: 916.67, paidAmount: 916.67, status: 'paid', paidAt: new Date('2024-10-01') },
    { id: 'INS-005', number: 5, dueDate: new Date('2024-11-01'), originalAmount: 916.67, currentAmount: 916.67, paidAmount: 916.67, status: 'paid', paidAt: new Date('2024-11-03') },
    { id: 'INS-006', number: 6, dueDate: new Date('2024-12-01'), originalAmount: 916.67, currentAmount: 916.67, paidAmount: 916.67, status: 'paid', paidAt: new Date('2024-12-01') },
    { id: 'INS-007', number: 7, dueDate: new Date('2024-12-15'), originalAmount: 916.67, currentAmount: 916.67, paidAmount: 916.67, status: 'paid', paidAt: new Date('2024-12-15') },
    { id: 'INS-008', number: 8, dueDate: new Date('2024-12-22'), originalAmount: 916.67, currentAmount: 916.67, paidAmount: 916.67, status: 'paid', paidAt: new Date('2024-12-22') },
    { id: 'INS-009', number: 9, dueDate: new Date('2024-12-23'), originalAmount: 916.67, currentAmount: 1050.00, paidAmount: 0, status: 'overdue' },
    { id: 'INS-010', number: 10, dueDate: new Date('2025-01-01'), originalAmount: 916.67, currentAmount: 980.00, paidAmount: 0, status: 'overdue' },
    { id: 'INS-011', number: 11, dueDate: new Date('2025-02-01'), originalAmount: 916.67, currentAmount: 916.67, paidAmount: 0, status: 'pending' },
    { id: 'INS-012', number: 12, dueDate: new Date('2025-03-01'), originalAmount: 916.67, currentAmount: 916.67, paidAmount: 0, status: 'pending' }
  ],
  timeline: [
    {
      id: 'EVT-001',
      type: 'consent_given',
      timestamp: new Date('2024-06-15T10:00:00'),
      channel: 'system',
      content: 'Cliente aceitou termos de comunicação via WhatsApp',
      status: 'success'
    },
    {
      id: 'EVT-002',
      type: 'message_sent',
      timestamp: new Date('2024-12-24T09:00:00'),
      channel: 'whatsapp',
      operator: 'Sistema',
      content: 'Olá Maria! Identificamos que a parcela 9 do seu empréstimo venceu ontem. Podemos ajudar?',
      status: 'success'
    },
    {
      id: 'EVT-003',
      type: 'message_delivered',
      timestamp: new Date('2024-12-24T09:00:05'),
      channel: 'whatsapp',
      status: 'success'
    },
    {
      id: 'EVT-004',
      type: 'message_read',
      timestamp: new Date('2024-12-24T14:30:00'),
      channel: 'whatsapp',
      status: 'success'
    },
    {
      id: 'EVT-005',
      type: 'message_sent',
      timestamp: new Date('2024-12-27T09:00:00'),
      channel: 'whatsapp',
      operator: 'Sistema',
      content: 'Maria, sua parcela está com 4 dias de atraso. Evite juros adicionais, regularize agora!',
      status: 'success'
    },
    {
      id: 'EVT-006',
      type: 'message_delivered',
      timestamp: new Date('2024-12-27T09:00:03'),
      channel: 'whatsapp',
      status: 'success'
    },
    {
      id: 'EVT-007',
      type: 'call_made',
      timestamp: new Date('2024-12-30T10:30:00'),
      channel: 'phone',
      operator: 'Ana Costa',
      content: 'Tentativa de contato telefônico',
      status: 'success'
    },
    {
      id: 'EVT-008',
      type: 'call_missed',
      timestamp: new Date('2024-12-30T10:30:45'),
      channel: 'phone',
      operator: 'Ana Costa',
      content: 'Cliente não atendeu após 45 segundos',
      status: 'failed'
    },
    {
      id: 'EVT-009',
      type: 'message_sent',
      timestamp: new Date('2025-01-02T09:00:00'),
      channel: 'whatsapp',
      operator: 'Sistema',
      content: 'Maria, temos condições especiais para você regularizar. Quer conhecer?',
      status: 'success'
    },
    {
      id: 'EVT-010',
      type: 'message_read',
      timestamp: new Date('2025-01-02T11:15:00'),
      channel: 'whatsapp',
      status: 'success'
    },
    {
      id: 'EVT-011',
      type: 'call_made',
      timestamp: new Date('2025-01-03T14:00:00'),
      channel: 'phone',
      operator: 'Ana Costa',
      content: 'Segunda tentativa de contato',
      status: 'success'
    },
    {
      id: 'EVT-012',
      type: 'call_answered',
      timestamp: new Date('2025-01-03T14:00:15'),
      channel: 'phone',
      operator: 'Ana Costa',
      content: 'Cliente atendeu. Explicou dificuldades financeiras temporárias. Interessada em acordo.',
      status: 'success',
      metadata: { duration: '8min 30s' }
    },
    {
      id: 'EVT-013',
      type: 'note_added',
      timestamp: new Date('2025-01-03T14:15:00'),
      operator: 'Ana Costa',
      content: 'Cliente relatou que teve despesas médicas inesperadas em dezembro. Demonstra boa vontade em regularizar. Sugerir parcelamento das parcelas em atraso.',
      status: 'success'
    },
    {
      id: 'EVT-014',
      type: 'deal_proposed',
      timestamp: new Date('2025-01-06T10:00:00'),
      channel: 'whatsapp',
      operator: 'Ana Costa',
      content: 'Proposta: Parcelamento das 2 parcelas em atraso (R$ 2.030,00) em 3x de R$ 720,00 sem juros adicionais.',
      status: 'success',
      metadata: { dealId: 'DEAL-001', totalValue: 2160.00, installments: 3 }
    },
    {
      id: 'EVT-015',
      type: 'message_read',
      timestamp: new Date('2025-01-06T12:45:00'),
      channel: 'whatsapp',
      status: 'success'
    },
    {
      id: 'EVT-016',
      type: 'message_sent',
      timestamp: new Date('2025-01-06T14:30:00'),
      channel: 'whatsapp',
      operator: 'Ana Costa',
      content: 'Maria, viu nossa proposta? Estou à disposição para esclarecer qualquer dúvida!',
      status: 'success'
    }
  ],
  notes: [
    'Cliente relatou dificuldades financeiras temporárias em dezembro',
    'Histórico de bom pagador - primeira inadimplência',
    'Interessada em acordo para parcelamento'
  ]
};
