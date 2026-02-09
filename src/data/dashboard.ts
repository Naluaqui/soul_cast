export const dashboardKPIs = {
  totalPortfolio: 2450000.00,
  defaultAmount: 680000.00,
  contactRate: 0.68,
  conversionRate: 0.42,
  recoveredAmount: 285000.00,
  paymentPromises: 127,
  slaCompliance: 0.94
};

export const funnelData = [
  { stage: 'Tentativas', value: 1250, rate: 1.0 },
  { stage: 'Contato', value: 850, rate: 0.68 },
  { stage: 'Negociação', value: 620, rate: 0.50 },
  { stage: 'Promessa', value: 380, rate: 0.30 },
  { stage: 'Pagamento', value: 190, rate: 0.15 }
];

export const timeSeriesData = [
  { date: '01/01', tentativas: 850, contatos: 580, pagamentos: 120 },
  { date: '02/01', tentativas: 920, contatos: 625, pagamentos: 135 },
  { date: '03/01', tentativas: 880, contatos: 600, pagamentos: 125 },
  { date: '04/01', tentativas: 1050, contatos: 715, pagamentos: 155 },
  { date: '05/01', tentativas: 980, contatos: 665, pagamentos: 145 },
  { date: '06/01', tentativas: 1100, contatos: 750, pagamentos: 165 },
  { date: '07/01', tentativas: 1250, contatos: 850, pagamentos: 190 }
];

export const recoveryByPeriod = [
  { period: 'D+1 a D+7', amount: 85000, percentage: 29.8 },
  { period: 'D+8 a D+15', amount: 72000, percentage: 25.3 },
  { period: 'D+16 a D+30', amount: 68000, percentage: 23.9 },
  { period: 'D+31 a D+60', amount: 42000, percentage: 14.7 },
  { period: 'D+60+', amount: 18000, percentage: 6.3 }
];

export const alerts = [
  {
    id: 1,
    type: 'warning' as const,
    message: '3 templates WhatsApp pendentes de aprovação',
    timestamp: new Date('2025-01-07T10:30:00')
  },
  {
    id: 2,
    type: 'error' as const,
    message: 'Falha na integração com Banco XYZ - últimas 2 horas',
    timestamp: new Date('2025-01-07T11:45:00')
  },
  {
    id: 3,
    type: 'info' as const,
    message: 'Pico de opt-out detectado: +15% nas últimas 24h',
    timestamp: new Date('2025-01-07T09:15:00')
  }
];

export const channelPerformance = [
  { channel: 'WhatsApp', contacts: 680, conversions: 320, rate: 0.47 },
  { channel: 'SMS', contacts: 420, conversions: 145, rate: 0.35 },
  { channel: 'Email', contacts: 150, conversions: 35, rate: 0.23 }
];