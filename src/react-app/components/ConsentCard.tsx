import { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Plus, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConsentType {
  id: number;
  code: string;
  name: string;
  description: string;
  legal_basis: string;
  is_required: boolean;
}

interface ConsentRecord {
  id: number;
  consent_type_id: number;
  type_code: string;
  type_name: string;
  legal_basis: string;
  is_required: boolean;
  status: string;
  granted_at: string | null;
  revoked_at: string | null;
  collection_method: string | null;
  collection_channel: string | null;
  collected_by_name: string | null;
  created_at: string;
}

interface ConsentCardProps {
  caseId: number;
  customerDocument: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  onConsentChange?: () => void;
}

export default function ConsentCard({ 
  caseId, 
  customerDocument, 
  customerName,
  customerEmail,
  customerPhone,
  onConsentChange 
}: ConsentCardProps) {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [types, setTypes] = useState<ConsentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ConsentType | null>(null);
  const [grantingConsent, setGrantingConsent] = useState(false);

  useEffect(() => {
    fetchData();
  }, [caseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [consentsRes, typesRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/consents`, { credentials: 'include' }),
        fetch('/api/consent/types', { credentials: 'include' })
      ]);

      if (consentsRes.ok) setConsents(await consentsRes.json());
      if (typesRes.ok) setTypes(await typesRes.json());
    } catch (err) {
      console.error('Error fetching consent data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantConsent = async (typeId: number, channel: string) => {
    setGrantingConsent(true);
    try {
      const res = await fetch('/api/consent', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          customer_document: customerDocument,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          consent_type_id: typeId,
          status: 'granted',
          collection_method: 'explicit',
          collection_channel: channel
        })
      });

      if (res.ok) {
        await fetchData();
        onConsentChange?.();
        setShowGrantModal(false);
        setSelectedType(null);
      }
    } catch (err) {
      console.error('Error granting consent:', err);
    } finally {
      setGrantingConsent(false);
    }
  };

  const handleRevokeConsent = async (consentId: number) => {
    try {
      const res = await fetch(`/api/consent/${consentId}/revoke`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Revogado pelo operador' })
      });

      if (res.ok) {
        await fetchData();
        onConsentChange?.();
      }
    } catch (err) {
      console.error('Error revoking consent:', err);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      granted: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
      revoked: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
    };
    return configs[status] || configs.pending;
  };

  // Get consent status for each type
  const consentsByType = types.map(type => {
    const record = consents.find(c => c.consent_type_id === type.id);
    return { type, record };
  });

  const requiredCount = types.filter(t => t.is_required).length;
  const grantedRequiredCount = consentsByType.filter(
    c => c.type.is_required && c.record?.status === 'granted'
  ).length;
  const allRequiredGranted = requiredCount === grantedRequiredCount;

  const missingTypes = types.filter(type => 
    !consents.find(c => c.consent_type_id === type.id && c.status === 'granted')
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando consentimentos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            allRequiredGranted ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            <Shield className={`w-5 h-5 ${allRequiredGranted ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">Consentimento LGPD</p>
            <p className="text-sm text-gray-500">
              {allRequiredGranted 
                ? 'Todos os consentimentos obrigatórios concedidos'
                : `${grantedRequiredCount}/${requiredCount} obrigatórios`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            allRequiredGranted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {allRequiredGranted ? 'Completo' : 'Pendente'}
          </span>
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {consentsByType.map(({ type, record }) => {
            const status = record ? getStatusConfig(record.status) : getStatusConfig('pending');
            return (
              <div 
                key={type.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status.bg}`}>
                    {status.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{type.name}</p>
                      {type.is_required && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Obrigatório</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{type.legal_basis}</p>
                    {record?.granted_at && record.status === 'granted' && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Concedido em {format(new Date(record.granted_at), "dd/MM/yyyy", { locale: ptBR })} 
                        {record.collection_channel && ` via ${record.collection_channel}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {record?.status === 'granted' ? (
                    <button
                      onClick={() => handleRevokeConsent(record.id)}
                      className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Revogar
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedType(type);
                        setShowGrantModal(true);
                      }}
                      className="text-xs px-2 py-1 text-green-600 hover:bg-green-50 rounded transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Registrar
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {missingTypes.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedType(missingTypes[0]);
                  setShowGrantModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Registrar Consentimento
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grant Modal */}
      {showGrantModal && selectedType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Registrar Consentimento</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedType.name}</p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Selecione o canal pelo qual o consentimento foi obtido:
              </p>
              <div className="space-y-2">
                {['WhatsApp', 'Telefone', 'E-mail', 'Presencial', 'Sistema'].map((channel) => (
                  <button
                    key={channel}
                    onClick={() => handleGrantConsent(selectedType.id, channel.toLowerCase())}
                    disabled={grantingConsent}
                    className="w-full py-2.5 px-4 text-left text-sm border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors disabled:opacity-50"
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setShowGrantModal(false);
                  setSelectedType(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
