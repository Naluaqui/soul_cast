import { useState } from 'react';
import { 
  X, Copy, Check, RefreshCw, 
  AlertTriangle, CheckCircle, Settings, Key, Globe, Database, Save
} from 'lucide-react';

interface Integration {
  id: number;
  name: string;
  type: string;
  category: string;
  config: string | null;
  credentials: string | null;
  status: string;
  environment: string;
}

interface IntegrationConfigModalProps {
  integration: Integration;
  onClose: () => void;
  onSave: () => void;
}

// ----------------------------------------------------------------------
// GERADOR MATEMÁTICO (ID -> CHAVE FIXA)
// ----------------------------------------------------------------------
const generateStableKey = (id: number, type: string) => {
  const prefix = type === 'beta_erp' ? 'beta_' : 'sap_';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  
  for (let i = 0; i < 32; i++) {
    const seed = id + (i * 1337); 
    const randomish = Math.abs(Math.sin(seed) * 10000) % 1;
    result += chars.charAt(Math.floor(randomish * chars.length));
  }
  
  return result;
};

export default function IntegrationConfigModal({ integration, onClose, onSave }: IntegrationConfigModalProps) {
  const config = integration.config ? JSON.parse(integration.config) : {};
  const credentials = integration.credentials ? JSON.parse(integration.credentials) : {};

  // Estados de Salvamento
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // SAP B1 state
  const [sapBaseUrl, setSapBaseUrl] = useState(config.base_url || '');
  const [sapCompanyDb, setSapCompanyDb] = useState(config.company_db || '');
  const [sapPort, setSapPort] = useState(config.service_layer_port || '50000');
  const [sapUsername, setSapUsername] = useState(credentials.username || '');
  const [sapPassword, setSapPassword] = useState(credentials.password || '');
  
  // 🛡️ INICIALIZAÇÃO SAP
  const [sapApiKey, setSapApiKey] = useState(() => {
    if (credentials.api_key && credentials.api_key.length > 5) return credentials.api_key;
    if (integration.type === 'sap_b1') return generateStableKey(integration.id, 'sap_b1');
    return '';
  });

  const [sapSyncCustomers, setSapSyncCustomers] = useState(config.sync_customers !== false);
  const [sapSyncInvoices, setSapSyncInvoices] = useState(config.sync_invoices !== false);
  const [sapSyncPayments, setSapSyncPayments] = useState(config.sync_payments !== false);

  // Beta ERP state
  const [betaBaseUrl, setBetaBaseUrl] = useState(config.base_url || '');
  const [betaApiVersion, setBetaApiVersion] = useState(config.api_version || 'v1');
  
  // 🛡️ INICIALIZAÇÃO BETA
  const [betaApiKey, setBetaApiKey] = useState(() => {
    // 1. Se já tem no banco (e não é vazia), usa a do banco
    if (credentials.api_key && credentials.api_key.length > 5) {
        return credentials.api_key;
    }
    // 2. Se não, gera a fixa baseada no ID
    if (integration.type === 'beta_erp') {
        const newKey = generateStableKey(integration.id, 'beta_erp');
        return newKey;
    }
    return '';
  });

  const [betaApiSecret, setBetaApiSecret] = useState(credentials.api_secret || '');
  const [betaSyncCases, setBetaSyncCases] = useState(config.sync_cases !== false);
  const [betaSyncCustomers, setBetaSyncCustomers] = useState(config.sync_customers !== false);
  const [betaSyncPayments, setBetaSyncPayments] = useState(config.sync_payments !== false);
  const [betaWebhookEnabled, setBetaWebhookEnabled] = useState(config.webhook_enabled !== false);

  // Common state
  const [environment, setEnvironment] = useState(integration.environment || 'sandbox');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/integrations/${integration.id}/test`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Conexão estabelecida!' : 'Falha na conexão')
      });
    } catch (err) {
      setTestResult({ success: false, message: 'Erro ao testar conexão' });
    } finally {
      setTesting(false);
    }
  };

  // ----------------------------------------------------------------------
  // O SALVAMENTO 
  // ----------------------------------------------------------------------
  const handleSave = async () => {
    setSaveStatus('saving');
    
    try {
      let newConfig: any = {};
      let newCredentials: any = {};

      // === LÓGICA SAP ===
      if (integration.type === 'sap_b1') {
        // Garante que existe uma chave, mesmo que o state tenha falhado
        const finalSapKey = (sapApiKey && sapApiKey.length > 5) 
            ? sapApiKey 
            : generateStableKey(integration.id, 'sap_b1');

        newConfig = {
          base_url: sapBaseUrl,
          company_db: sapCompanyDb,
          service_layer_port: sapPort,
          sync_customers: sapSyncCustomers,
          sync_invoices: sapSyncInvoices,
          sync_payments: sapSyncPayments,
          sync_direction: 'bidirectional'
        };
        newCredentials = {
          username: sapUsername,
          password: sapPassword,
          api_key: finalSapKey, 
          ssl_enabled: true
        };
      } 
      
      // === LÓGICA BETA ERP (AQUI TÁ O FIX) ===
      else if (integration.type === 'beta_erp') {
        
        // 1. Pega do State OU Gera de Novo se estiver vazio
        let finalBetaKey = betaApiKey;
        if (!finalBetaKey || finalBetaKey.length < 5) {
            console.warn('[Save] Chave Beta estava vazia! Gerando novamente...');
            finalBetaKey = generateStableKey(integration.id, 'beta_erp');
        }

        newConfig = {
          base_url: betaBaseUrl,
          api_version: betaApiVersion,
          sync_cases: betaSyncCases,
          sync_customers: betaSyncCustomers,
          sync_payments: betaSyncPayments,
          webhook_enabled: betaWebhookEnabled,
          webhook_url: `${window.location.origin}/api/external/beta/webhook`
        };
        
        // 2. Monta o objeto Explicitamente
        newCredentials = {
          api_key: finalBetaKey, // Tem que ir preenchido!
          api_secret: betaApiSecret
        };
      }


      const res = await fetch(`/api/integrations/${integration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          config: newConfig,
          credentials: newCredentials,
          environment,
          status: 'active'
        })
      });

      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => { onSave(); }, 1500);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const baseUrl = window.location.origin;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              integration.type === 'sap_b1' 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-purple-100 text-purple-600'
            }`}>
              {integration.type === 'sap_b1' ? '📊' : '🔗'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{integration.name}</h2>
              <p className="text-sm text-gray-500">Configurar integração</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Status Feedback Banner */}
          {saveStatus === 'success' && (
            <div className="p-4 bg-green-100 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 animate-pulse">
                <CheckCircle className="w-5 h-5" />
                <strong>Sucesso!</strong> Credenciais e configurações salvas no banco de dados.
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <strong>Erro ao salvar.</strong> Tente novamente ou verifique o console (F12).
            </div>
          )}

          {/* Environment Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Ambiente</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEnvironment('sandbox')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  environment === 'sandbox' 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                Sandbox
              </button>
              <button
                onClick={() => setEnvironment('production')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  environment === 'production' 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                Produção
              </button>
            </div>
          </div>

          {/* SAP B1 Configuration */}
          {integration.type === 'sap_b1' && (
            <>
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Globe className="w-4 h-4" />
                  Conexão SAP Business One
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL do Service Layer</label>
                    <input
                      type="text"
                      value={sapBaseUrl}
                      onChange={(e) => setSapBaseUrl(e.target.value)}
                      placeholder="https://sap-server.prospera.com.br"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Database</label>
                    <input
                      type="text"
                      value={sapCompanyDb}
                      onChange={(e) => setSapCompanyDb(e.target.value)}
                      placeholder="PROSPERA_PROD"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Porta</label>
                    <input
                      type="text"
                      value={sapPort}
                      onChange={(e) => setSapPort(e.target.value)}
                      placeholder="50000"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Key className="w-4 h-4" />
                  Credenciais SAP
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuário SAP</label>
                    <input
                      type="text"
                      value={sapUsername}
                      onChange={(e) => setSapUsername(e.target.value)}
                      placeholder="manager"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                    <input
                      type="password"
                      value={sapPassword}
                      onChange={(e) => setSapPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key (para chamadas do SAP)</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono text-gray-700 truncate">
                      {sapApiKey}
                    </code>
                    <button
                      onClick={() => handleCopy(sapApiKey, 'sapApiKey')}
                      className={`p-2 rounded-lg transition-colors ${
                        copied === 'sapApiKey' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {copied === 'sapApiKey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Database className="w-4 h-4" />
                  Sincronização
                </h3>
                
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={sapSyncInvoices}
                    onChange={(e) => setSapSyncInvoices(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Sincronizar Notas Fiscais/Títulos</span>
                    <p className="text-xs text-gray-500">Importar títulos em aberto do SAP</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={sapSyncPayments}
                    onChange={(e) => setSapSyncPayments(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Sincronizar Pagamentos</span>
                    <p className="text-xs text-gray-500">Enviar baixas de pagamento para o SAP</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={sapSyncCustomers}
                    onChange={(e) => setSapSyncCustomers(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Sincronizar Clientes</span>
                    <p className="text-xs text-gray-500">Manter dados de clientes atualizados</p>
                  </div>
                </label>
              </div>

              {/* SAP Endpoints Documentation */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Endpoints para o SAP chamar:</h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">POST</span>
                    <code className="text-blue-700">{baseUrl}/api/external/sap/invoices</code>
                    <button onClick={() => handleCopy(`${baseUrl}/api/external/sap/invoices`, 'sapInvoices')} className="text-blue-500 hover:text-blue-700">
                      {copied === 'sapInvoices' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">GET</span>
                    <code className="text-blue-700">{baseUrl}/api/external/sap/payments</code>
                    <button onClick={() => handleCopy(`${baseUrl}/api/external/sap/payments`, 'sapPayments')} className="text-blue-500 hover:text-blue-700">
                      {copied === 'sapPayments' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Use o header <code className="bg-blue-100 px-1 rounded">X-API-Key</code> com a API Key acima
                </p>
              </div>
            </>
          )}

          {/* Beta ERP Configuration */}
          {integration.type === 'beta_erp' && (
            <>
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Globe className="w-4 h-4" />
                  Conexão ERP Beta
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Base da API</label>
                    <input
                      type="text"
                      value={betaBaseUrl}
                      onChange={(e) => setBetaBaseUrl(e.target.value)}
                      placeholder="https://api.beta.meuprospera.com.br"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Versão API</label>
                    <select
                      value={betaApiVersion}
                      onChange={(e) => setBetaApiVersion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="v1">v1</option>
                      <option value="v2">v2</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Key className="w-4 h-4" />
                  Credenciais
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key (para o Beta chamar Soul Collect)</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono text-gray-700 truncate border border-purple-200">
                      {betaApiKey}
                    </code>
                    <button
                      onClick={() => handleCopy(betaApiKey, 'betaApiKey')}
                      className={`p-2 rounded-lg transition-colors ${
                        copied === 'betaApiKey' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {copied === 'betaApiKey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Esta chave é única para esta integração.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Secret do Beta (para Soul Collect chamar o Beta)</label>
                  <input
                    type="password"
                    value={betaApiSecret}
                    onChange={(e) => setBetaApiSecret(e.target.value)}
                    placeholder="Solicite à equipe do Beta"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Database className="w-4 h-4" />
                  Sincronização
                </h3>
                
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={betaSyncCustomers}
                    onChange={(e) => setBetaSyncCustomers(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Receber Clientes/Devedores</span>
                    <p className="text-xs text-gray-500">Importar clientes do CRM Beta</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={betaSyncCases}
                    onChange={(e) => setBetaSyncCases(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Enviar Status de Casos</span>
                    <p className="text-xs text-gray-500">Atualizar o Beta com status da cobrança</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={betaSyncPayments}
                    onChange={(e) => setBetaSyncPayments(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Sincronizar Pagamentos</span>
                    <p className="text-xs text-gray-500">Receber notificações de pagamento do Beta</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={betaWebhookEnabled}
                    onChange={(e) => setBetaWebhookEnabled(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Habilitar Webhooks</span>
                    <p className="text-xs text-gray-500">Receber eventos em tempo real do Beta</p>
                  </div>
                </label>
              </div>

              {/* Beta Endpoints Documentation */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="text-sm font-semibold text-purple-900 mb-2">Endpoints para o ERP Beta chamar:</h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">POST</span>
                    <code className="text-purple-700">{baseUrl}/api/external/beta/customers</code>
                    <button onClick={() => handleCopy(`${baseUrl}/api/external/beta/customers`, 'betaCustomers')} className="text-purple-500 hover:text-purple-700">
                      {copied === 'betaCustomers' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">GET</span>
                    <code className="text-purple-700">{baseUrl}/api/external/beta/cases</code>
                    <button onClick={() => handleCopy(`${baseUrl}/api/external/beta/cases`, 'betaCases')} className="text-purple-500 hover:text-purple-700">
                      {copied === 'betaCases' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">POST</span>
                    <code className="text-purple-700">{baseUrl}/api/external/beta/payments</code>
                    <button onClick={() => handleCopy(`${baseUrl}/api/external/beta/payments`, 'betaPayments')} className="text-purple-500 hover:text-purple-700">
                      {copied === 'betaPayments' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">POST</span>
                    <code className="text-purple-700">{baseUrl}/api/external/beta/webhook</code>
                    <button onClick={() => handleCopy(`${baseUrl}/api/external/beta/webhook`, 'betaWebhook')} className="text-purple-500 hover:text-purple-700">
                      {copied === 'betaWebhook' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  Use o header <code className="bg-purple-100 px-1 rounded">X-API-Key</code> com a API Key acima
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700">
                  Compartilhe a <strong>API Key</strong> e os <strong>endpoints</strong> acima com a equipe do Beta para configurar a integração no sistema deles.
                </p>
              </div>
            </>
          )}

          {/* Test Connection Result */}
          {testResult && (
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-gray-200">
          <button
            onClick={handleTest}
            disabled={testing || saveStatus === 'saving'}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            Testar Conexão
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving' || saveStatus === 'success'}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all ${
                saveStatus === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : saveStatus === 'error'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-70`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <Check className="w-4 h-4" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Configuração
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}