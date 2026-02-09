import { useState, useEffect, useCallback } from 'react';

export interface JourneyStep {
  id?: number;
  journey_id?: number;
  step_order: number;
  day_offset: number;
  channel: string;
  action_type: string;
  action_title: string;
  template_content?: string;
  conditions?: string;
  is_active?: boolean;
}

export interface Journey {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  trigger_conditions?: string;
  cases_active: number;
  conversion_rate: number;
  steps: JourneyStep[];
  created_at: string;
  updated_at: string;
}

export function useJourneys() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJourneys = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/journeys', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch journeys');
      const data = await response.json();
      setJourneys(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  const createJourney = async (journey: Partial<Journey>) => {
    const response = await fetch('/api/journeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(journey),
    });
    if (!response.ok) throw new Error('Failed to create journey');
    const data = await response.json();
    await fetchJourneys();
    return data;
  };

  const updateJourney = async (id: number, journey: Partial<Journey>) => {
    const response = await fetch(`/api/journeys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(journey),
    });
    if (!response.ok) throw new Error('Failed to update journey');
    await fetchJourneys();
  };

  const deleteJourney = async (id: number) => {
    const response = await fetch(`/api/journeys/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete journey');
    await fetchJourneys();
  };

  const toggleJourneyStatus = async (id: number) => {
    const response = await fetch(`/api/journeys/${id}/toggle`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to toggle journey status');
    const data = await response.json();
    await fetchJourneys();
    return data.status;
  };

  return {
    journeys,
    loading,
    error,
    refetch: fetchJourneys,
    createJourney,
    updateJourney,
    deleteJourney,
    toggleJourneyStatus,
  };
}

export function useDashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/stats', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
