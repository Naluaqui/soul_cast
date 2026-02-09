export type CaseStatus = 'new' | 'contacted' | 'negotiating' | 'promised' | 'paid' | 'defaulted' | 'paused';
export type Channel = 'whatsapp' | 'sms' | 'email' | 'phone';

export interface CaseItem {
  id: string;
  customerId: string;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  customerEmail: string;
  contractId: string;
  contractType: string;
  totalDebt: number;
  daysOverdue: number;
  status: CaseStatus;
  lastContactChannel: Channel;
  lastContactDate: Date | null;
  nextActionDate: Date;
  assignedOperator: string;
  riskScore: number;
  hasConsent: boolean;
  installmentsOverdue: number;
  totalInstallments: number;
  createdAt: Date;
}

export const caseStatusLabels: Record<CaseStatus, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  negotiating: 'Em Negociação',
  promised: 'Promessa',
  paid: 'Pago',
  defaulted: 'Inadimplente',
  paused: 'Pausado'
};

export const caseStatusColors: Record<CaseStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  negotiating: 'bg-purple-100 text-purple-800',
  promised: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  defaulted: 'bg-red-100 text-red-800',
  paused: 'bg-gray-100 text-gray-800'
};

export const channelLabels: Record<Channel, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'E-mail',
  phone: 'Telefone'
};

export const channelIcons: Record<Channel, string> = {
  whatsapp: '📱',
  sms: '💬',
  email: '📧',
  phone: '📞'
};

// Mock data for demo mode
export const mockCases: CaseItem[] = [
  {
    id: 'CASE-001',
    customerId: 'CUST-001',
    customerName: 'Maria Silva Santos',
    customerDocument: '***.***.789-00',
    customerPhone: '+55 11 9****-1234',
    customerEmail: 'm***@email.com',
    contractId: 'CTR-2024-001',
    contractType: 'Empréstimo Pessoal',
    totalDebt: 4580.00,
    daysOverdue: 15,
    status: 'negotiating',
    lastContactChannel: 'whatsapp',
    lastContactDate: new Date('2025-01-06T14:30:00'),
    nextActionDate: new Date('2025-01-08T10:00:00'),
    assignedOperator: 'Ana Costa',
    riskScore: 65,
    hasConsent: true,
    installmentsOverdue: 2,
    totalInstallments: 12,
    createdAt: new Date('2024-12-20')
  },
  {
    id: 'CASE-002',
    customerId: 'CUST-002',
    customerName: 'João Pedro Oliveira',
    customerDocument: '***.***.456-11',
    customerPhone: '+55 21 9****-5678',
    customerEmail: 'j***@email.com',
    contractId: 'CTR-2024-002',
    contractType: 'Cartão de Crédito',
    totalDebt: 12350.00,
    daysOverdue: 45,
    status: 'contacted',
    lastContactChannel: 'whatsapp',
    lastContactDate: new Date('2025-01-05T09:15:00'),
    nextActionDate: new Date('2025-01-07T14:00:00'),
    assignedOperator: 'Carlos Mendes',
    riskScore: 82,
    hasConsent: true,
    installmentsOverdue: 3,
    totalInstallments: 6,
    createdAt: new Date('2024-11-15')
  },
  {
    id: 'CASE-003',
    customerId: 'CUST-003',
    customerName: 'Ana Beatriz Ferreira',
    customerDocument: '***.***.123-22',
    customerPhone: '+55 31 9****-9012',
    customerEmail: 'a***@email.com',
    contractId: 'CTR-2024-003',
    contractType: 'Financiamento Veículo',
    totalDebt: 28900.00,
    daysOverdue: 7,
    status: 'new',
    lastContactChannel: 'email',
    lastContactDate: null,
    nextActionDate: new Date('2025-01-07T08:00:00'),
    assignedOperator: 'Ana Costa',
    riskScore: 45,
    hasConsent: true,
    installmentsOverdue: 1,
    totalInstallments: 48,
    createdAt: new Date('2025-01-01')
  },
  {
    id: 'CASE-004',
    customerId: 'CUST-004',
    customerName: 'Roberto Carlos Lima',
    customerDocument: '***.***.987-33',
    customerPhone: '+55 11 9****-3456',
    customerEmail: 'r***@email.com',
    contractId: 'CTR-2024-004',
    contractType: 'Empréstimo Consignado',
    totalDebt: 8750.00,
    daysOverdue: 30,
    status: 'promised',
    lastContactChannel: 'phone',
    lastContactDate: new Date('2025-01-04T16:45:00'),
    nextActionDate: new Date('2025-01-10T10:00:00'),
    assignedOperator: 'Mariana Souza',
    riskScore: 55,
    hasConsent: true,
    installmentsOverdue: 2,
    totalInstallments: 24,
    createdAt: new Date('2024-12-05')
  },
  {
    id: 'CASE-005',
    customerId: 'CUST-005',
    customerName: 'Fernanda Almeida Costa',
    customerDocument: '***.***.654-44',
    customerPhone: '+55 19 9****-7890',
    customerEmail: 'f***@email.com',
    contractId: 'CTR-2024-005',
    contractType: 'Cartão de Crédito',
    totalDebt: 3200.00,
    daysOverdue: 3,
    status: 'new',
    lastContactChannel: 'whatsapp',
    lastContactDate: null,
    nextActionDate: new Date('2025-01-07T09:00:00'),
    assignedOperator: 'Carlos Mendes',
    riskScore: 25,
    hasConsent: true,
    installmentsOverdue: 1,
    totalInstallments: 1,
    createdAt: new Date('2025-01-04')
  },
  {
    id: 'CASE-006',
    customerId: 'CUST-006',
    customerName: 'Paulo Henrique Barbosa',
    customerDocument: '***.***.321-55',
    customerPhone: '+55 41 9****-2345',
    customerEmail: 'p***@email.com',
    contractId: 'CTR-2024-006',
    contractType: 'Empréstimo Pessoal',
    totalDebt: 15680.00,
    daysOverdue: 60,
    status: 'defaulted',
    lastContactChannel: 'whatsapp',
    lastContactDate: new Date('2025-01-02T11:20:00'),
    nextActionDate: new Date('2025-01-09T14:00:00'),
    assignedOperator: 'Mariana Souza',
    riskScore: 95,
    hasConsent: false,
    installmentsOverdue: 4,
    totalInstallments: 18,
    createdAt: new Date('2024-11-01')
  },
  {
    id: 'CASE-007',
    customerId: 'CUST-007',
    customerName: 'Luciana Martins',
    customerDocument: '***.***.852-66',
    customerPhone: '+55 51 9****-6789',
    customerEmail: 'l***@email.com',
    contractId: 'CTR-2024-007',
    contractType: 'Financiamento Imóvel',
    totalDebt: 45000.00,
    daysOverdue: 22,
    status: 'negotiating',
    lastContactChannel: 'phone',
    lastContactDate: new Date('2025-01-06T10:00:00'),
    nextActionDate: new Date('2025-01-08T15:00:00'),
    assignedOperator: 'Ana Costa',
    riskScore: 70,
    hasConsent: true,
    installmentsOverdue: 2,
    totalInstallments: 360,
    createdAt: new Date('2024-12-10')
  },
  {
    id: 'CASE-008',
    customerId: 'CUST-008',
    customerName: 'Marcos Antônio Reis',
    customerDocument: '***.***.147-77',
    customerPhone: '+55 71 9****-0123',
    customerEmail: 'm***@email.com',
    contractId: 'CTR-2024-008',
    contractType: 'Cartão de Crédito',
    totalDebt: 6890.00,
    daysOverdue: 12,
    status: 'contacted',
    lastContactChannel: 'sms',
    lastContactDate: new Date('2025-01-05T13:30:00'),
    nextActionDate: new Date('2025-01-07T11:00:00'),
    assignedOperator: 'Carlos Mendes',
    riskScore: 50,
    hasConsent: true,
    installmentsOverdue: 1,
    totalInstallments: 3,
    createdAt: new Date('2024-12-25')
  },
  {
    id: 'CASE-009',
    customerId: 'CUST-009',
    customerName: 'Camila Rodrigues',
    customerDocument: '***.***.369-88',
    customerPhone: '+55 85 9****-4567',
    customerEmail: 'c***@email.com',
    contractId: 'CTR-2024-009',
    contractType: 'Empréstimo Pessoal',
    totalDebt: 2100.00,
    daysOverdue: 5,
    status: 'paid',
    lastContactChannel: 'whatsapp',
    lastContactDate: new Date('2025-01-06T16:00:00'),
    nextActionDate: new Date('2025-01-07T10:00:00'),
    assignedOperator: 'Mariana Souza',
    riskScore: 15,
    hasConsent: true,
    installmentsOverdue: 0,
    totalInstallments: 6,
    createdAt: new Date('2025-01-02')
  },
  {
    id: 'CASE-010',
    customerId: 'CUST-010',
    customerName: 'Ricardo Souza Neto',
    customerDocument: '***.***.258-99',
    customerPhone: '+55 27 9****-8901',
    customerEmail: 'r***@email.com',
    contractId: 'CTR-2024-010',
    contractType: 'Financiamento Veículo',
    totalDebt: 18500.00,
    daysOverdue: 35,
    status: 'paused',
    lastContactChannel: 'email',
    lastContactDate: new Date('2025-01-03T09:45:00'),
    nextActionDate: new Date('2025-01-15T10:00:00'),
    assignedOperator: 'Ana Costa',
    riskScore: 60,
    hasConsent: true,
    installmentsOverdue: 2,
    totalInstallments: 36,
    createdAt: new Date('2024-12-01')
  }
];

export const operators = [
  { id: 'op-1', name: 'Ana Costa' },
  { id: 'op-2', name: 'Carlos Mendes' },
  { id: 'op-3', name: 'Mariana Souza' }
];

export const contractTypes = [
  'Empréstimo Pessoal',
  'Cartão de Crédito',
  'Financiamento Veículo',
  'Financiamento Imóvel',
  'Empréstimo Consignado'
];
