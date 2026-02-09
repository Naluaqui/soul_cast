import { useState, useEffect, useCallback } from 'react';

export type CaseStatus = 'new' | 'contacted' | 'negotiating' | 'promised' | 'paid' | 'defaulted' | 'paused';
export type Channel = 'whatsapp' | 'sms' | 'email' | 'phone';

export interface Case {
  id: number;
  case_number: string;
  customer_name: string;
  customer_document: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  contract_id: string | null;
  contract_type: string | null;
  total_debt: number;
  days_overdue: number;
  status: CaseStatus;
  last_contact_channel: Channel | null;
  last_contact_at: string | null;
  next_action_at: string | null;
  assigned_operator_id: number | null;
  assigned_operator_name: string | null;
  risk_score: number;
  has_consent: number;
  installments_overdue: number;
  total_installments: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseTimeline {
  id: number;
  case_id: number;
  event_type: string;
  title: string;
  description: string | null;
  channel: string | null;
  user_id: number | null;
  user_name: string | null;
  metadata: string | null;
  created_at: string;
}

export interface CaseInstallment {
  id: number;
  case_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseWithDetails extends Case {
  timeline: CaseTimeline[];
  installments: CaseInstallment[];
}

export interface CaseStats {
  total_cases: number;
  total_debt: number;
  new_count: number;
  contacted_count: number;
  negotiating_count: number;
  promised_count: number;
  paid_count: number;
  defaulted_count: number;
  paused_count: number;
  without_consent_count: number;
}

export function useCases(filters?: { status?: string; search?: string; limit?: number; offset?: number }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.limit) params.set('limit', filters.limit.toString());
      if (filters?.offset) params.set('offset', filters.offset.toString());

      const url = `/api/cases${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      
      if (!res.ok) throw new Error('Failed to fetch cases');
      
      const data = await res.json();
      setCases(data.cases);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.search, filters?.limit, filters?.offset]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const createCase = async (caseData: Partial<Case>) => {
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(caseData),
    });
    if (!res.ok) throw new Error('Failed to create case');
    const result = await res.json();
    await fetchCases();
    return result;
  };

  const updateCase = async (id: number, caseData: Partial<Case>) => {
    const res = await fetch(`/api/cases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(caseData),
    });
    if (!res.ok) throw new Error('Failed to update case');
    await fetchCases();
  };

  const deleteCase = async (id: number) => {
    const res = await fetch(`/api/cases/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete case');
    await fetchCases();
  };

  return { cases, total, loading, error, refetch: fetchCases, createCase, updateCase, deleteCase };
}

export function useCaseStats() {
  const [stats, setStats] = useState<CaseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/cases/stats', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch case stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return { stats, loading };
}

export function useCaseDetail(caseId: string | undefined) {
  const [caseData, setCaseData] = useState<CaseWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCase = useCallback(async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/cases/${caseId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Case not found');
      const data = await res.json();
      setCaseData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const addTimelineEvent = async (event: { event_type: string; title: string; description?: string; channel?: string; metadata?: any }) => {
    if (!caseData) return;
    const res = await fetch(`/api/cases/${caseData.id}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error('Failed to add timeline event');
    await fetchCase();
  };

  const updateStatus = async (status: CaseStatus) => {
    if (!caseData) return;
    const res = await fetch(`/api/cases/${caseData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    await fetchCase();
  };

  return { caseData, loading, error, refetch: fetchCase, addTimelineEvent, updateStatus };
}

// Constants for labels and colors
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

export const contractTypes = [
  'Empréstimo Pessoal',
  'Cartão de Crédito',
  'Financiamento Veículo',
  'Financiamento Imóvel',
  'Empréstimo Consignado'
];
