import { useState, useEffect } from 'react';
import { X, Save, Settings, Target, Database, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface DashboardConfigModalProps {
  onClose: () => void;
  onSave: () => void;
}

interface ConfigItem {
  value: string | null;
  type: string;
  label: string;
  description: string;
}

export default function DashboardConfigModal({ onClose, onSave }: DashboardConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'goals' | 'manual' | 'settings'>('goals');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Record<string, ConfigItem>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/config', { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao carregar configurações');
      const data = await response.json();
      
      // Flatten config
      const flatConfig: Record<string, ConfigItem> = {};
      const flatValues: Record<string, string> = {};
      
      for (const row of data.raw) {
        flatConfig[row.config_key] = {
          value: row.config_value,
          type: row.config_type,
          label: row.label,
          description: row.description
        };
        flatValues[row.config_key] = row.config_value || '';
      }
      
      setConfig(flatConfig);
      setValues(flatValues);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ configs: values })
      });
      
      if (!response.ok) throw new Error('Erro ao salvar configurações');
      
      setSuccess(true);
      setTimeout(() => {
        onSave();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const renderField = (key: string, item: ConfigItem) => {
    const value = values[key] || '';
    
    if (item.type === 'currency') {
      return (
        <div key={key} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{item.label}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
            <input
              type="text"
              value={value ? parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                handleValueChange(key, raw ? String(parseInt(raw) / 100) : '');
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0,00"
            />
          </div>
          <p className="text-xs text-gray-500">{item.description}</p>
        </div>
      );
    }
    
    if (item.type === 'percentage') {
      return (
        <div key={key} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{item.label}</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={value}
              onChange={(e) => handleValueChange(key, e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-500">{item.description}</p>
        </div>
      );
    }
    
    if (item.type === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">{item.label}</label>
            <p className="text-xs text-gray-500">{item.description}</p>
          </div>
          <button
            onClick={() => handleValueChange(key, value === '1' ? '0' : '1')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value === '1' ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value === '1' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      );
    }
    
    if (item.type === 'select' && key === 'data_source') {
      return (
        <div key={key} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{item.label}</label>
          <select
            value={value}
            onChange={(e) => handleValueChange(key, e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="system">Sistema (calculado automaticamente)</option>
            <option value="manual">Manual (valores inseridos)</option>
            <option value="integration">Integração (via API/ERP)</option>
            <option value="hybrid">Híbrido (prioriza integração, depois manual)</option>
          </select>
          <p className="text-xs text-gray-500">{item.description}</p>
        </div>
      );
    }
    
    return (
      <div key={key} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{item.label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleValueChange(key, e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500">{item.description}</p>
      </div>
    );
  };

  const tabs = [
    { id: 'goals' as const, label: 'Metas', icon: Target },
    { id: 'manual' as const, label: 'Dados Manuais', icon: Database },
    { id: 'settings' as const, label: 'Configurações', icon: Settings }
  ];

  const goalFields = ['monthly_goal', 'annual_goal', 'sla_target', 'contact_rate_target', 'conversion_rate_target'];
  const manualFields = ['manual_portfolio_value', 'manual_default_value', 'manual_recovered_value'];
  const settingsFields = ['use_manual_data', 'data_source'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Configurar Dashboard</h2>
              <p className="text-sm text-gray-600">Defina metas e insira dados manualmente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'goals' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-900">Defina suas metas</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          As metas são usadas para calcular o progresso no dashboard e gerar alertas quando você estiver abaixo do esperado.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goalFields.map(key => config[key] && renderField(key, config[key]))}
                  </div>
                </div>
              )}

              {activeTab === 'manual' && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-900">Inserção manual de dados</h3>
                        <p className="text-sm text-amber-700 mt-1">
                          Use estes campos para inserir valores manualmente quando não houver integração ativa ou para ajustar os valores calculados pelo sistema. Deixe em branco para usar os valores automáticos.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {manualFields.map(key => config[key] && renderField(key, config[key]))}
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-medium text-gray-900 mb-4">Importar dados em lote</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">
                        Arraste um arquivo CSV ou Excel aqui
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Formato esperado: valor_carteira, valor_inadimplencia, valor_recuperado
                      </p>
                      <button className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        Selecionar arquivo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Settings className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-gray-900">Configurações de fonte de dados</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Configure de onde o dashboard deve buscar os dados para exibição.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {settingsFields.map(key => config[key] && renderField(key, config[key]))}
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Prioridade de dados</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• <strong>Sistema:</strong> Calcula valores com base nos casos cadastrados</li>
                      <li>• <strong>Manual:</strong> Usa valores inseridos manualmente acima</li>
                      <li>• <strong>Integração:</strong> Busca dados das integrações ativas (ERP/CRM)</li>
                      <li>• <strong>Híbrido:</strong> Integração → Manual → Sistema</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Configurações salvas com sucesso!
            </div>
          )}
          {!error && !success && <div />}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
