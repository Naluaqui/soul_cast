import { useState } from 'react';
import { 
  Sparkles, 
  Database, 
  Shield, 
  Brain,
  Activity,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  FileText
} from 'lucide-react';
import AIChat from '@/react-app/components/AIChat';
import KnowledgeBase from '@/react-app/components/KnowledgeBase';

type TabType = 'copilot' | 'knowledge' | 'supervisor';

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('copilot');

  const agentStats = [
    { label: 'Sugestões Geradas', value: '1.247', change: '+12%', icon: MessageSquare },
    { label: 'Acordos Sugeridos', value: '384', change: '+8%', icon: FileText },
    { label: 'Checks Compliance', value: '892', change: '+15%', icon: Shield },
    { label: 'Alertas Gerados', value: '23', change: '-5%', icon: AlertTriangle }
  ];

  const supervisorAlerts = [
    { id: 1, type: 'warning', message: 'Frequência de contato próxima do limite para cliente Maria Silva', case: 'CASE-001', time: '5 min atrás' },
    { id: 2, type: 'critical', message: 'Tentativa de mensagem para cliente sem consentimento bloqueada', case: 'CASE-042', time: '15 min atrás' },
    { id: 3, type: 'info', message: 'Novo documento adicionado à base de conhecimento requer revisão', case: null, time: '1 hora atrás' },
    { id: 4, type: 'warning', message: 'Tom potencialmente inadequado detectado em rascunho de mensagem', case: 'CASE-018', time: '2 horas atrás' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agentes de IA</h1>
              <p className="text-gray-500 mt-1">Copilot inteligente e base de conhecimento com RAG</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">IA Online</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {agentStats.map((stat, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-purple-600" />
                  <span className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'copilot' 
                  ? 'border-purple-600 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Copilot do Operador
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'knowledge' 
                  ? 'border-purple-600 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className="w-4 h-4" />
              Base de Conhecimento
            </button>
            <button
              onClick={() => setActiveTab('supervisor')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'supervisor' 
                  ? 'border-purple-600 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              Supervisor Agent
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'copilot' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat */}
            <div className="lg:col-span-2 h-[600px]">
              <AIChat />
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Context Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Contexto do Copilot
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-900">Caso Ativo</p>
                    <p className="text-purple-700">CASE-001 - Maria Silva Santos</p>
                    <p className="text-purple-600 text-xs mt-1">R$ 2.030,00 • D+15</p>
                  </div>
                  <div className="text-gray-600">
                    <p className="font-medium text-gray-900 mb-1">Fontes Disponíveis:</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        5 documentos de políticas
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        Histórico do caso
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        Tabela de descontos
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        Scripts aprovados
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">💡 Dicas de Uso</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Use os botões rápidos para ações comuns</li>
                  <li>• Peça sugestões de mensagem personalizadas</li>
                  <li>• Solicite cálculo de acordos com descontos</li>
                  <li>• Verifique compliance antes de enviar</li>
                  <li>• O Copilot cita as fontes consultadas</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="h-[700px]">
            <KnowledgeBase />
          </div>
        )}

        {activeTab === 'supervisor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alerts */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Alertas do Supervisor</h3>
                  <p className="text-sm text-gray-500">Monitoramento automático de compliance e riscos</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {supervisorAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          alert.type === 'critical' ? 'bg-red-100' :
                          alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <AlertTriangle className={`w-4 h-4 ${
                            alert.type === 'critical' ? 'text-red-600' :
                            alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{alert.message}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {alert.case && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {alert.case}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{alert.time}</span>
                          </div>
                        </div>
                        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                          Analisar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Supervisor Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Status do Supervisor
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Casos Monitorados</span>
                    <span className="font-semibold text-gray-900">247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Alertas Hoje</span>
                    <span className="font-semibold text-yellow-600">4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bloqueios Automáticos</span>
                    <span className="font-semibold text-red-600">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taxa de Compliance</span>
                    <span className="font-semibold text-green-600">98.5%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Regras Ativas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <span className="text-sm text-green-800">Limite de Frequência</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <span className="text-sm text-green-800">Verificação Consentimento</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <span className="text-sm text-green-800">Análise de Tom</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <span className="text-sm text-green-800">Horário de Contato</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
