import { useState } from 'react';
import { X, Building2, ArrowLeftRight, Plus, AlertCircle } from 'lucide-react';

interface NewIntegrationModalProps {
  onClose: () => void;
  onSave: () => void;
  defaultCategory?: 'bank' | 'erp';
}

type IntegrationType = {
  id: string;
  name: string;
  description: string;
  category: 'bank' | 'erp';
  icon: string;
  fields: { key: string; label: string; type: string; placeholder?: string; required?: boolean }[];
};

const integrationTypes: IntegrationType[] = [
  {
    id: 'pix',
    name: 'PIX',
    description: 'Recebimentos via PIX QR Code',
    category: 'bank',
    icon: '⚡',
    fields: [
      { key: 'bank', label: 'Banco', type: 'text', placeholder: 'Ex: Banco do Brasil', required: true },
      { key: 'pix_key', label: 'Chave PIX', type: 'text', placeholder: 'CNPJ, Email, Telefone ou Aleatória', required: true },
      { key: 'api_url', label: 'URL da API', type: 'text', placeholder: 'https://api.banco.com.br/pix' },
      { key: 'client_id', label: 'Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
    ]
  },
  {
    id: 'boleto',
    name: 'Boleto Bancário',
    description: 'Emissão de boletos registrados',
    category: 'bank',
    icon: '📄',
    fields: [
      { key: 'bank', label: 'Banco', type: 'text', placeholder: 'Ex: Itaú', required: true },
      { key: 'agency', label: 'Agência', type: 'text', placeholder: '0001', required: true },
      { key: 'account', label: 'Conta', type: 'text', placeholder: '12345-6', required: true },
      { key: 'wallet', label: 'Carteira', type: 'text', placeholder: '109' },
      { key: 'api_url', label: 'URL da API', type: 'text', placeholder: 'https://api.banco.com.br/boletos' },
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
    ]
  },
  {
    id: 'ted',
    name: 'TED/DOC',
    description: 'Transferências bancárias',
    category: 'bank',
    icon: '💸',
    fields: [
      { key: 'bank', label: 'Banco', type: 'text', placeholder: 'Ex: Bradesco', required: true },
      { key: 'agency', label: 'Agência', type: 'text', required: true },
      { key: 'account', label: 'Conta', type: 'text', required: true },
      { key: 'api_url', label: 'URL da API', type: 'text' },
      { key: 'username', label: 'Usuário', type: 'text' },
      { key: 'password', label: 'Senha', type: 'password' },
    ]
  },
  {
    id: 'sap_b1',
    name: 'SAP Business One',
    description: 'Integração com SAP B1 Service Layer',
    category: 'erp',
    icon: '📊',
    fields: [
      { key: 'base_url', label: 'URL do Service Layer', type: 'text', placeholder: 'https://sap-server.empresa.com.br', required: true },
      { key: 'company_db', label: 'Company Database', type: 'text', placeholder: 'EMPRESA_PROD', required: true },
      { key: 'service_layer_port', label: 'Porta', type: 'text', placeholder: '50000' },
      { key: 'username', label: 'Usuário SAP', type: 'text', required: true },
      { key: 'password', label: 'Senha', type: 'password', required: true },
    ]
  },
  {
    id: 'beta_erp',
    name: 'ERP Beta (Prospera)',
    description: 'Sincronização com sistema Beta',
    category: 'erp',
    icon: '🔗',
    fields: [
      { key: 'base_url', label: 'URL Base da API', type: 'text', placeholder: 'https://api.beta.empresa.com.br', required: true },
      { key: 'api_version', label: 'Versão API', type: 'select', placeholder: 'v1' },
      { key: 'api_secret', label: 'API Secret', type: 'password', placeholder: 'Solicite à equipe do Beta', required: true },
    ]
  },
  {
    id: 'rest',
    name: 'API REST Personalizada',
    description: 'Integração com API REST genérica',
    category: 'erp',
    icon: '🌐',
    fields: [
      { key: 'base_url', label: 'URL Base', type: 'text', placeholder: 'https://api.sistema.com.br', required: true },
      { key: 'auth_type', label: 'Tipo de Autenticação', type: 'select', placeholder: 'bearer' },
      { key: 'api_key', label: 'API Key / Token', type: 'password', required: true },
      { key: 'custom_headers', label: 'Headers Personalizados (JSON)', type: 'textarea' },
    ]
  },
];

export default function NewIntegrationModal({ onClose, onSave, defaultCategory }: NewIntegrationModalProps) {
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
  const [category, setCategory] = useState<'bank' | 'erp'>(defaultCategory || 'bank');
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [syncInterval, setSyncInterval] = useState('60');
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTypes = integrationTypes.filter(t => t.category === category);

  const handleSelectType = (type: IntegrationType) => {
    setSelectedType(type);
    setName(type.name);
    setStep('configure');
  };

  const handleSave = async () => {
    if (!selectedType || !name.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validate required fields
    const missingFields = selectedType.fields
      .filter(f => f.required && !configValues[f.key] && !credentialValues[f.key])
      .map(f => f.label);
    
    if (missingFields.length > 0) {
      setError(`Campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Separate config and credentials
      const config: Record<string, any> = {};
      const credentials: Record<string, any> = {};
      
      selectedType.fields.forEach(field => {
        const value = configValues[field.key] || credentialValues[field.key];
        if (value) {
          if (field.type === 'password' || field.key.includes('secret') || field.key.includes('password') || field.key.includes('api_key') || field.key.includes('client_')) {
            credentials[field.key] = value;
          } else {
            config[field.key] = value;
          }
        }
      });

      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          type: selectedType.id,
          category: selectedType.category,
          config,
          credentials,
          status: 'inactive',
          sync_interval: parseInt(syncInterval) || 60,
          environment
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao criar integração');
      }

      onSave();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar integração');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (key: string, value: string, isCredential: boolean) => {
    if (isCredential) {
      setCredentialValues(prev => ({ ...prev, [key]: value }));
    } else {
      setConfigValues(prev => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Nova Integração</h2>
              <p className="text-sm text-gray-500">
                {step === 'select' ? 'Escolha o tipo de integração' : `Configurar ${selectedType?.name}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {step === 'select' && (
            <>
              {/* Category Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setCategory('bank')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    category === 'bank'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Bancos
                </button>
                <button
                  onClick={() => setCategory('erp')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    category === 'erp'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  ERP / Sistemas
                </button>
              </div>

              {/* Integration Types Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleSelectType(type)}
                    className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-2xl group-hover:from-blue-100 group-hover:to-blue-50 transition-all">
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'configure' && selectedType && (
            <div className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Informações Básicas</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Integração <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: PIX Banco do Brasil"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEnvironment('sandbox')}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                          environment === 'sandbox'
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                        }`}
                      >
                        Sandbox
                      </button>
                      <button
                        onClick={() => setEnvironment('production')}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                          environment === 'production'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                        }`}
                      >
                        Produção
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo de Sync</label>
                    <select
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="15">15 minutos</option>
                      <option value="30">30 minutos</option>
                      <option value="60">1 hora</option>
                      <option value="120">2 horas</option>
                      <option value="360">6 horas</option>
                      <option value="720">12 horas</option>
                      <option value="1440">24 horas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Configuração</h3>
                
                {selectedType.fields.map((field) => {
                  const isCredential = field.type === 'password' || 
                    field.key.includes('secret') || 
                    field.key.includes('password') || 
                    field.key.includes('api_key') ||
                    field.key.includes('client_');
                  
                  const value = isCredential ? (credentialValues[field.key] || '') : (configValues[field.key] || '');
                  
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.type === 'select' ? (
                        <select
                          value={value}
                          onChange={(e) => handleFieldChange(field.key, e.target.value, isCredential)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecione...</option>
                          {field.key === 'api_version' && (
                            <>
                              <option value="v1">v1</option>
                              <option value="v2">v2</option>
                            </>
                          )}
                          {field.key === 'auth_type' && (
                            <>
                              <option value="bearer">Bearer Token</option>
                              <option value="api_key">API Key (Header)</option>
                              <option value="basic">Basic Auth</option>
                            </>
                          )}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={value}
                          onChange={(e) => handleFieldChange(field.key, e.target.value, isCredential)}
                          placeholder={field.placeholder}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={value}
                          onChange={(e) => handleFieldChange(field.key, e.target.value, isCredential)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Próximos passos:</strong> Após criar a integração, você poderá configurar opções avançadas 
                  e testar a conexão antes de ativá-la.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-200">
          {step === 'configure' ? (
            <>
              <button
                onClick={() => {
                  setStep('select');
                  setSelectedType(null);
                  setConfigValues({});
                  setCredentialValues({});
                  setError(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ← Voltar
              </button>
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Criar Integração
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
