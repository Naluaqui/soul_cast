import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Target, CheckCircle, Clock, Activity, RefreshCw, Loader2, Settings, Database, Zap } from 'lucide-react';
import KPICard from '@/react-app/components/KPICard';
import FunnelChart from '@/react-app/components/FunnelChart';
import TimeSeriesChart from '@/react-app/components/TimeSeriesChart';
import RecoveryPieChart from '@/react-app/components/RecoveryPieChart';
import AlertsList from '@/react-app/components/AlertsList';
import DashboardConfigModal from '@/react-app/components/DashboardConfigModal';

interface DashboardStats {
  totalPortfolio: number;
  defaultAmount: number;
  recoveredAmount: number;
  paymentPromises: number;
  contactRate: number;
  conversionRate: number;
  totalCases: number;
  slaCompliance: number;
  statusCounts: Array<{ status: string; count: number; debt: number }>;
  goals?: {
    monthly: number;
    annual: number;
    slaTarget: number;
    contactRateTarget: number;
    conversionRateTarget: number;
  };
  goalProgress?: number;
  dataSource?: string;
  useManualData?: boolean;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/enhanced-stats', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  // Show loading state
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  // Default values if no stats
  const displayStats = stats || {
    totalPortfolio: 0,
    defaultAmount: 0,
    recoveredAmount: 0,
    paymentPromises: 0,
    contactRate: 0,
    conversionRate: 0,
    totalCases: 0,
    slaCompliance: 0.92,
    statusCounts: [],
  };

  const monthlyGoal = displayStats.goals?.monthly || 320000;
  const goalProgress = displayStats.goalProgress || (displayStats.recoveredAmount / monthlyGoal);
  
  const dataSourceLabel = {
    system: 'Sistema',
    manual: 'Manual',
    integration: 'Integração',
    hybrid: 'Híbrido'
  }[displayStats.dataSource || 'system'] || 'Sistema';

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Cobrança</h1>
          <p className="text-gray-600">Visão geral da operação de recuperação de crédito</p>
        </div>
        <div className="flex items-center gap-4">
          {displayStats.dataSource && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              {displayStats.dataSource === 'integration' ? (
                <Zap className="w-3.5 h-3.5 text-green-600" />
              ) : displayStats.dataSource === 'manual' ? (
                <Database className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span className="text-xs font-medium text-gray-600">
                Fonte: {dataSourceLabel}
              </span>
            </div>
          )}
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </button>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Erro ao carregar dados: {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Carteira Total"
          value={formatCurrency(displayStats.totalPortfolio)}
          subtitle={`${displayStats.totalCases} casos ativos`}
          icon={DollarSign}
          color="blue"
          trend={{ value: 5.2, isPositive: false }}
        />
        
        <KPICard
          title="Inadimplência"
          value={formatCurrency(displayStats.defaultAmount)}
          subtitle={`${displayStats.totalPortfolio > 0 ? ((displayStats.defaultAmount / displayStats.totalPortfolio) * 100).toFixed(1) : 0}% da carteira`}
          icon={TrendingUp}
          color="red"
          trend={{ value: 2.1, isPositive: false }}
        />
        
        <KPICard
          title="Taxa de Contato"
          value={`${(displayStats.contactRate * 100).toFixed(0)}%`}
          subtitle="Contatos realizados vs tentativas"
          icon={Users}
          color="purple"
          trend={{ value: 8.5, isPositive: true }}
        />
        
        <KPICard
          title="Taxa de Conversão"
          value={`${(displayStats.conversionRate * 100).toFixed(0)}%`}
          subtitle="Pagamentos vs contatos"
          icon={Target}
          color="green"
          trend={{ value: 3.2, isPositive: true }}
        />
        
        <KPICard
          title="Valor Recuperado"
          value={formatCurrency(displayStats.recoveredAmount)}
          subtitle="Últimos 30 dias"
          icon={CheckCircle}
          color="green"
          trend={{ value: 12.4, isPositive: true }}
        />
        
        <KPICard
          title="Promessas de Pagamento"
          value={displayStats.paymentPromises.toString()}
          subtitle="Aguardando confirmação"
          icon={Clock}
          color="orange"
        />
        
        <KPICard
          title="SLA de Atendimento"
          value={`${(displayStats.slaCompliance * 100).toFixed(0)}%`}
          subtitle="Meta: 95%"
          icon={Activity}
          color="indigo"
          trend={{ value: 1.2, isPositive: false }}
        />
        
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80 mb-1">Meta do Mês</p>
            <p className="text-2xl font-bold">{formatCurrency(monthlyGoal)}</p>
            <div className="mt-3 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${Math.min(goalProgress * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-white/80 mt-2">
              {(goalProgress * 100).toFixed(1)}% alcançado
            </p>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      {displayStats.statusCounts && displayStats.statusCounts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Distribuição por Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {displayStats.statusCounts.map((item: any) => (
              <div key={item.status} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                <p className="text-xs text-gray-500 capitalize">{item.status}</p>
                <p className="text-xs text-gray-400">{formatCurrency(item.debt || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart />
        <TimeSeriesChart />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecoveryPieChart />
        <AlertsList />
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <DashboardConfigModal
          onClose={() => setShowConfigModal(false)}
          onSave={() => {
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
