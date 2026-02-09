import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  AlertTriangle, Shield, Eye, CheckCircle, Clock, 
  TrendingUp, Users, ArrowRight, RefreshCw,
  Bell, ChevronRight, XCircle, MessageSquare, Phone,
  Calendar, Target, MoreVertical, Search, X, UserCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RiskAlert {
  id: number;
  case_id: number;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  risk_score: number;
  is_acknowledged: boolean;
  is_resolved: boolean;
  metadata: string | null;
  created_at: string;
  case_number?: string;
  customer_name?: string;
  total_debt?: number;
}

interface RiskRule {
  id: number;
  name: string;
  description: string;
  rule_type: string;
  conditions: string;
  severity: string;
  is_active: boolean;
}

interface SupervisorStats {
  total_alerts: number;
  critical_alerts: number;
  pending_actions: number;
  resolved_today: number;
  cases_at_risk: number;
  avg_resolution_time: number;
}

export default function SupervisorPage() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [stats, setStats] = useState<SupervisorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules' | 'actions'>('alerts');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, rulesRes, statsRes] = await Promise.all([
        fetch('/api/risk-alerts', { credentials: 'include' }),
        fetch('/api/risk-rules', { credentials: 'include' }),
        fetch('/api/supervisor/stats', { credentials: 'include' })
      ]);

      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: number) => {
    try {
      const res = await fetch(`/api/risk-alerts/${alertId}/acknowledge`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setAlerts(alerts.map(a => 
          a.id === alertId ? { ...a, is_acknowledged: true } : a
        ));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleResolve = async (alertId: number, notes?: string) => {
    try {
      const res = await fetch(`/api/risk-alerts/${alertId}/resolve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (res.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId));
        setSelectedAlert(null);
        setShowActionModal(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleToggleRule = async (ruleId: number) => {
    try {
      const res = await fetch(`/api/risk-rules/${ruleId}/toggle`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setRules(rules.map(r => 
          r.id === ruleId ? { ...r, is_active: !r.is_active } : r
        ));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getSeverityConfig = (severity: string) => {
    const configs: Record<string, { bg: string; text: string; icon: string; label: string }> = {
      critical: { bg: 'bg-red-100', text: 'text-red-700', icon: 'bg-red-500', label: 'Crítico' },
      high: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'bg-orange-500', label: 'Alto' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'bg-yellow-500', label: 'Médio' },
      low: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'bg-blue-500', label: 'Baixo' },
    };
    return configs[severity] || configs.medium;
  };

  const getAlertTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      broken_promise: <XCircle className="w-4 h-4" />,
      no_contact: <Phone className="w-4 h-4" />,
      high_value_risk: <TrendingUp className="w-4 h-4" />,
      high_risk_score: <Target className="w-4 h-4" />,
      escalation_needed: <Users className="w-4 h-4" />,
      missing_consent: <Shield className="w-4 h-4" />,
    };
    return icons[type] || <AlertTriangle className="w-4 h-4" />;
  };

  const filteredAlerts = alerts.filter(a => 
    !a.is_resolved && (severityFilter === 'all' || a.severity === severityFilter)
  );

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length;
  const highCount = alerts.filter(a => a.severity === 'high' && !a.is_resolved).length;

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-600" />
            Supervisor Agent
          </h1>
          <p className="text-gray-500 mt-1">Monitoramento de riscos e supervisão inteligente</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Bell className="w-4 h-4" />
            Configurar Alertas
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {criticalCount > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 mb-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">{criticalCount} alerta{criticalCount > 1 ? 's' : ''} crítico{criticalCount > 1 ? 's' : ''} requer{criticalCount === 1 ? '' : 'em'} atenção imediata</p>
              <p className="text-sm text-red-100">Casos com alto valor ou risco elevado precisam de intervenção</p>
            </div>
          </div>
          <button 
            onClick={() => setSeverityFilter('critical')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            Ver Críticos
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Bell className="w-4 h-4" />
            <span className="text-xs font-medium">Total Alertas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.total_alerts || filteredAlerts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Críticos</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Alto Risco</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{highCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Casos em Risco</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.cases_at_risk || new Set(alerts.map(a => a.case_id)).size}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Resolvidos Hoje</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats?.resolved_today || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Tempo Médio</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.avg_resolution_time || 2}h</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {[
          { id: 'alerts' as const, label: 'Alertas Ativos', icon: AlertTriangle, count: filteredAlerts.length },
          { id: 'rules' as const, label: 'Regras de Risco', icon: Target },
          { id: 'actions' as const, label: 'Ações Pendentes', icon: Clock },
        ].map((tab) => {
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
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
              {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    severityFilter === sev
                      ? sev === 'critical' ? 'bg-red-100 text-red-700'
                        : sev === 'high' ? 'bg-orange-100 text-orange-700'
                        : sev === 'medium' ? 'bg-yellow-100 text-yellow-700'
                        : sev === 'low' ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {sev === 'all' ? 'Todos' : getSeverityConfig(sev).label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar alertas..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Alert Cards */}
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const severity = getSeverityConfig(alert.severity);
              return (
                <div 
                  key={alert.id}
                  className={`bg-white rounded-xl border-l-4 ${
                    alert.severity === 'critical' ? 'border-l-red-500' :
                    alert.severity === 'high' ? 'border-l-orange-500' :
                    alert.severity === 'medium' ? 'border-l-yellow-500' :
                    'border-l-blue-500'
                  } border border-gray-200 p-4 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${severity.bg} flex items-center justify-center ${severity.text}`}>
                        {getAlertTypeIcon(alert.alert_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${severity.bg} ${severity.text}`}>
                            {severity.label}
                          </span>
                          {alert.is_acknowledged && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Visto
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {alert.case_number && (
                            <Link 
                              to={`/cases/${alert.case_id}`}
                              className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                            >
                              Caso #{alert.case_number}
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                          {alert.customer_name && (
                            <span>{alert.customer_name}</span>
                          )}
                          {alert.total_debt && (
                            <span className="font-medium">R$ {alert.total_debt.toLocaleString('pt-BR')}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(alert.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Score: {alert.risk_score}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.is_acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Marcar como visto"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedAlert(alert); setShowActionModal(true); }}
                        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Tomar Ação
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAlerts.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Nenhum alerta ativo</h3>
                <p className="text-sm text-gray-500">Todos os riscos estão sob controle no momento</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Configure regras para detecção automática de riscos</p>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
              <Target className="w-4 h-4" />
              Nova Regra
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {rules.map((rule) => {
              const severity = getSeverityConfig(rule.severity);
              return (
                <div key={rule.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${severity.icon}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{rule.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${severity.bg} ${severity.text}`}>
                          {severity.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{rule.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        rule.is_active ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        rule.is_active ? 'left-6' : 'left-1'
                      }`} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === 'actions' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Nenhuma ação pendente</h3>
          <p className="text-sm text-gray-500">Ações criadas a partir de alertas aparecerão aqui</p>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Tomar Ação</h2>
              <button onClick={() => setShowActionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-1">{selectedAlert.title}</h3>
                <p className="text-sm text-gray-600">{selectedAlert.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ações Sugeridas</label>
                <div className="space-y-2">
                  {[
                    { icon: Phone, label: 'Ligar para o cliente', action: 'call' },
                    { icon: MessageSquare, label: 'Enviar mensagem WhatsApp', action: 'whatsapp' },
                    { icon: UserCheck, label: 'Atribuir a outro operador', action: 'assign' },
                    { icon: Calendar, label: 'Agendar follow-up', action: 'schedule' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.action}
                        className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors text-left"
                      >
                        <Icon className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-700">{item.label}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas de Resolução (opcional)</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Descreva a ação tomada ou o motivo da resolução..."
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <div className="flex gap-2">
                <Link
                  to={`/cases/${selectedAlert.case_id}`}
                  className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-medium"
                >
                  Ver Caso
                </Link>
                <button
                  onClick={() => handleResolve(selectedAlert.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Resolver Alerta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
