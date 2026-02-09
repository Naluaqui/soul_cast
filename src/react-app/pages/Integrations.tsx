import { useState, useEffect } from 'react';
import { 
  Plus, CheckCircle, AlertTriangle, RefreshCw, 
  Settings, Copy, Eye, EyeOff, Play, Pause,
  Building2, Webhook, Database, ArrowLeftRight, Clock, Shield,
  ChevronRight, Search, MoreVertical, X, FileText
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import IntegrationConfigModal from '../components/IntegrationConfigModal';
import NewIntegrationModal from '../components/NewIntegrationModal';

type TabType = 'overview' | 'banks' | 'erp' | 'webhooks';

interface Integration {
  id: number;
  name: string;
  type: string;
  category: string;
  config: string | null;
  credentials: string | null;
  status: string;
  last_sync_at: string | null;
  sync_interval: number;
  stats_today: number;
  stats_month: number;
  stats_errors: number;
  success_rate: number;
  environment: string;
  created_at: string;
}

interface WebhookEndpoint {
  id: number;
  name: string;
  url: string;
  events: string;
  secret: string;
  status: string;
  stats_sent: number;
  stats_failed: number;
  avg_latency: number;
  created_at: string;
}

interface WebhookLog {
  id: number;
  endpoint_id: number;
  endpoint_name: string;
  event_type: string;
  status: string;
  status_code: number;
  latency: number;
  request_payload: string | null;
  response_body: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState<number | null>(null);
  const [searchWebhooks, setSearchWebhooks] = useState('');
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [testing, setTesting] = useState<number | null>(null);
  const [configModal, setConfigModal] = useState<Integration | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newModalCategory, setNewModalCategory] = useState<'bank' | 'erp' | undefined>(undefined);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [intRes, whRes, logsRes, statsRes] = await Promise.all([
        fetch('/api/integrations', { credentials: 'include' }),
        fetch('/api/webhooks', { credentials: 'include' }),
        fetch('/api/webhook-logs?limit=20', { credentials: 'include' }),
        fetch('/api/integrations/stats', { credentials: 'include' })
      ]);

      if (intRes.ok) setIntegrations(await intRes.json());
      if (whRes.ok) setWebhooks(await whRes.json());
      if (logsRes.ok) {
        const data = await logsRes.json();
        setWebhookLogs(data.logs || []);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (id: number) => {
    setSyncing(id);
    try {
      const res = await fetch(`/api/integrations/${id}/sync`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(null);
    }
  };

  const handleTestConnection = async (id: number) => {
    setTesting(id);
    try {
      const res = await fetch(`/api/integrations/${id}/test`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Test error:', err);
    } finally {
      setTesting(null);
    }
  };

  const handleToggleWebhook = async (id: number) => {
    try {
      const res = await fetch(`/api/webhooks/${id}/toggle`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleTestWebhook = async (id: number) => {
    setTesting(id);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Test error:', err);
    } finally {
      setTesting(null);
    }
  };

  const handleRetryLog = async (id: number) => {
    try {
      const res = await fetch(`/api/webhook-logs/${id}/retry`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Retry error:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      connected: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      disconnected: 'bg-gray-100 text-gray-600',
      paused: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      retrying: 'bg-yellow-100 text-yellow-700',
    };
    const labels: Record<string, string> = {
      active: 'Ativo',
      connected: 'Conectado',
      inactive: 'Inativo',
      disconnected: 'Desconectado',
      paused: 'Pausado',
      error: 'Erro',
      success: 'Sucesso',
      failed: 'Falhou',
      retrying: 'Tentando',
    };
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const bankIntegrations = integrations.filter(i => i.category === 'bank');
  const erpIntegrations = integrations.filter(i => i.category === 'erp');

  const tabs = [
    { id: 'overview' as TabType, label: 'Visão Geral', icon: Database },
    { id: 'banks' as TabType, label: 'Bancos', icon: Building2 },
    { id: 'erp' as TabType, label: 'ERP', icon: ArrowLeftRight },
    { id: 'webhooks' as TabType, label: 'Webhooks', icon: Webhook },
  ];

  const activeIntegrations = integrations.filter(i => i.status === 'active').length;
  const errorIntegrations = integrations.filter(i => i.status === 'error').length;

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
          <p className="text-gray-500 mt-1">Gerencie conexões com bancos, ERPs e webhooks</p>
        </div>
        <button 
          onClick={() => { setNewModalCategory(undefined); setShowNewModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Integração
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeIntegrations}</p>
                  <p className="text-sm text-gray-500">Conexões Ativas</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{errorIntegrations}</p>
                  <p className="text-sm text-gray-500">Com Erro</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats?.eventsToday?.toLocaleString() || 0}</p>
                  <p className="text-sm text-gray-500">Eventos Hoje</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">99.2%</p>
                  <p className="text-sm text-gray-500">Uptime</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Overview Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Banks Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">Bancos</h3>
                </div>
                <button 
                  onClick={() => setActiveTab('banks')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Ver todos <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {bankIntegrations.slice(0, 3).map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-lg">
                        {bank.type === 'pix' ? '⚡' : bank.type === 'boleto' ? '📄' : '💸'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{bank.name}</p>
                        <p className="text-xs text-gray-500">{bank.type.toUpperCase()}</p>
                      </div>
                    </div>
                    {getStatusBadge(bank.status)}
                  </div>
                ))}
              </div>
            </div>

            {/* ERP Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">ERP</h3>
                </div>
                <button 
                  onClick={() => setActiveTab('erp')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Ver todos <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {erpIntegrations.map((erp) => (
                  <div key={erp.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-lg">🔗</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{erp.name}</p>
                        <p className="text-xs text-gray-500">{erp.type}</p>
                      </div>
                    </div>
                    {getStatusBadge(erp.status)}
                  </div>
                ))}
              </div>
            </div>

            {/* Webhooks Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">Webhooks</h3>
                </div>
                <button 
                  onClick={() => setActiveTab('webhooks')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Ver todos <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {webhooks.map((wh) => {
                  const events = JSON.parse(wh.events || '[]');
                  return (
                    <div key={wh.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-lg">📡</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{wh.name}</p>
                          <p className="text-xs text-gray-500">{events.length} eventos</p>
                        </div>
                      </div>
                      {getStatusBadge(wh.status)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Atividade Recente</h3>
              <button onClick={fetchData} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {webhookLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === 'success' ? 'bg-green-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <code className="text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{log.event_type}</code>
                    <span className="text-sm text-gray-500">→ {log.endpoint_name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{log.latency}ms</span>
                    <span>{formatTime(log.created_at)}</span>
                  </div>
                </div>
              ))}
              {webhookLogs.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-500">
                  Nenhuma atividade recente
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Banks Tab */}
      {activeTab === 'banks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Configure conexões com PIX, Boleto e TED</p>
            <button 
              onClick={() => { setNewModalCategory('bank'); setShowNewModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Banco
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bankIntegrations.map((bank) => {
              const config = bank.config ? JSON.parse(bank.config) : {};
              return (
                <div 
                  key={bank.id} 
                  className={`bg-white rounded-xl border p-5 ${
                    bank.status === 'error' ? 'border-red-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl">
                        {bank.type === 'pix' ? '⚡' : bank.type === 'boleto' ? '📄' : '💸'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{bank.name}</h3>
                        <p className="text-sm text-gray-500">{config.bank || bank.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(bank.status)}
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {bank.status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Falha na autenticação. Verifique as credenciais.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Hoje</p>
                      <p className="text-xl font-bold text-gray-900">{bank.stats_today}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Mês</p>
                      <p className="text-xl font-bold text-gray-900">{bank.stats_month.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Sucesso</p>
                      <p className="text-xl font-bold text-green-600">{bank.success_rate}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      Última sync: {formatTime(bank.last_sync_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        bank.environment === 'production' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {bank.environment === 'production' ? 'Produção' : 'Sandbox'}
                      </span>
                      <button 
                        onClick={() => handleSync(bank.id)}
                        disabled={syncing === bank.id}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing === bank.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button 
                        onClick={() => setConfigModal(bank)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ERP Tab */}
      {activeTab === 'erp' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Sincronize contratos e clientes com seu ERP</p>
            <button 
              onClick={() => { setNewModalCategory('erp'); setShowNewModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Conectar ERP
            </button>
          </div>

          <div className="space-y-4">
            {erpIntegrations.map((erp) => {
              const config = erp.config ? JSON.parse(erp.config) : {};
              return (
                <div 
                  key={erp.id} 
                  className={`bg-white rounded-xl border p-5 ${
                    erp.status === 'error' ? 'border-red-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {erp.type.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{erp.name}</h3>
                        <p className="text-sm text-gray-500">{erp.type}</p>
                        {config.base_url && (
                          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 mt-1 inline-block">
                            {config.base_url}
                          </code>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(erp.status)}
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {erp.status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Timeout na conexão. Verifique se o servidor ERP está acessível.
                      </p>
                      <button 
                        onClick={() => handleTestConnection(erp.id)}
                        className="mt-2 text-sm text-red-700 underline"
                      >
                        Testar conexão
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Hoje</p>
                      <p className="text-xl font-bold text-gray-900">{erp.stats_today}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Mês</p>
                      <p className="text-xl font-bold text-gray-900">{erp.stats_month.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Erros</p>
                      <p className={`text-xl font-bold ${erp.stats_errors > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                        {erp.stats_errors}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Intervalo</p>
                      <p className="text-xl font-bold text-gray-900">{erp.sync_interval}min</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      Última sync: {formatTime(erp.last_sync_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleSync(erp.id)}
                        disabled={syncing === erp.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing === erp.id ? 'animate-spin' : ''}`} />
                        Sync Agora
                      </button>
                      <button 
                        onClick={() => setConfigModal(erp)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Settings className="w-4 h-4" />
                        Configurar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* API Documentation Link */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Documentação da API</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Acesse a documentação completa dos endpoints para integração com SAP Business One e ERP Beta.
                </p>
                <a 
                  href="/api-docs" 
                  className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  Ver Documentação da API
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Configure endpoints para receber eventos em tempo real</p>
            <button 
              onClick={() => { setNewModalCategory(undefined); setShowNewModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Webhook
            </button>
          </div>

          {/* Webhook Endpoints */}
          <div className="space-y-4">
            {webhooks.map((webhook) => {
              const events = JSON.parse(webhook.events || '[]');
              return (
                <div key={webhook.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{webhook.name}</h3>
                        {getStatusBadge(webhook.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-sm bg-gray-100 px-3 py-1 rounded text-gray-700 flex-1 truncate">
                          {webhook.url}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(webhook.url)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => handleToggleWebhook(webhook.id)}
                        className={`p-2 rounded-lg ${webhook.status === 'active' 
                          ? 'text-yellow-600 hover:bg-yellow-50' 
                          : 'text-green-600 hover:bg-green-50'}`}
                        title={webhook.status === 'active' ? 'Pausar' : 'Ativar'}
                      >
                        {webhook.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleTestWebhook(webhook.id)}
                        disabled={testing === webhook.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                        title="Testar"
                      >
                        <RefreshCw className={`w-4 h-4 ${testing === webhook.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {events.map((event: string) => (
                      <span key={event} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        {event}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Secret: </span>
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                        {showSecret === webhook.id ? webhook.secret : '••••••••••••'}
                      </code>
                      <button 
                        onClick={() => setShowSecret(showSecret === webhook.id ? null : webhook.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecret === webhook.id ? <EyeOff className="w-4 h-4 inline" /> : <Eye className="w-4 h-4 inline" />}
                      </button>
                    </div>
                    <div className="text-gray-500">
                      Enviados: <span className="font-semibold text-gray-900">{webhook.stats_sent.toLocaleString()}</span>
                    </div>
                    <div className="text-gray-500">
                      Falhas: <span className={`font-semibold ${webhook.stats_failed > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                        {webhook.stats_failed}
                      </span>
                    </div>
                    <div className="text-gray-500">
                      Latência: <span className="font-semibold text-gray-900">{webhook.avg_latency}ms</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Webhook Logs */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Logs de Entrega</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar evento..."
                      value={searchWebhooks}
                      onChange={(e) => setSearchWebhooks(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button 
                    onClick={fetchData}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </button>
                </div>
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Evento</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">HTTP</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Latência</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Horário</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {webhookLogs.filter(log => 
                  !searchWebhooks || log.event_type.toLowerCase().includes(searchWebhooks.toLowerCase())
                ).map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                        log.status === 'success' ? 'bg-green-100 text-green-700' :
                        log.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.status === 'success' ? <CheckCircle className="w-3 h-3" /> :
                         log.status === 'failed' ? <AlertTriangle className="w-3 h-3" /> :
                         <RefreshCw className="w-3 h-3" />}
                        {log.status === 'success' ? 'Sucesso' : log.status === 'failed' ? 'Falhou' : 'Tentando'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-900">{log.event_type}</code>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{log.endpoint_name}</td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-mono ${
                        log.status_code >= 200 && log.status_code < 300 ? 'text-green-600' :
                        log.status_code >= 500 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {log.status_code}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{log.latency}ms</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{formatTime(log.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {log.status === 'failed' && (
                          <button 
                            onClick={() => handleRetryLog(log.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Reenviar
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Ver Payload
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Events Reference */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Eventos Disponíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { category: 'Pagamentos', events: ['payment.confirmed', 'payment.failed', 'payment.refunded'] },
                { category: 'Casos', events: ['case.created', 'case.updated', 'case.resolved', 'case.escalated'] },
                { category: 'Comunicação', events: ['message.sent', 'message.delivered', 'message.read', 'customer.contacted'] },
              ].map((group) => (
                <div key={group.category}>
                  <p className="text-sm font-medium text-gray-700 mb-2">{group.category}</p>
                  <div className="space-y-1">
                    {group.events.map((event) => (
                      <code key={event} className="block text-xs bg-gray-50 px-2 py-1.5 rounded text-gray-600">
                        {event}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Detalhes do Webhook</h3>
                <p className="text-sm text-gray-500">{selectedLog.event_type}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Endpoint</p>
                  <p className="font-medium">{selectedLog.endpoint_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p>{getStatusBadge(selectedLog.status)}</p>
                </div>
                <div>
                  <p className="text-gray-500">HTTP Status</p>
                  <p className="font-mono">{selectedLog.status_code}</p>
                </div>
                <div>
                  <p className="text-gray-500">Latência</p>
                  <p>{selectedLog.latency}ms</p>
                </div>
                <div>
                  <p className="text-gray-500">Tentativas</p>
                  <p>{selectedLog.retry_count + 1}</p>
                </div>
                <div>
                  <p className="text-gray-500">Horário</p>
                  <p>{format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
                </div>
              </div>
              
              {selectedLog.request_payload && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Request Payload</p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.request_payload), null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.error_message && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Erro</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {selectedLog.error_message}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
              {selectedLog.status === 'failed' && (
                <button 
                  onClick={() => { handleRetryLog(selectedLog.id); setSelectedLog(null); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reenviar
                </button>
              )}
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integration Config Modal */}
      {configModal && (
        <IntegrationConfigModal
          integration={configModal}
          onClose={() => setConfigModal(null)}
          onSave={() => {
            setConfigModal(null);
            fetchData();
          }}
        />
      )}

      {/* New Integration Modal */}
      {showNewModal && (
        <NewIntegrationModal
          defaultCategory={newModalCategory}
          onClose={() => setShowNewModal(false)}
          onSave={() => {
            setShowNewModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
