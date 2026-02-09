import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  Shield, CheckCircle, XCircle, Clock, Search,
  Download, RefreshCw, Eye, History,
  FileText, Users, TrendingUp, AlertTriangle, X, Check
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
  case_id: number | null;
  customer_document: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
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
  updated_at: string;
}

interface ConsentStats {
  summary: {
    total_records: number;
    granted_count: number;
    pending_count: number;
    revoked_count: number;
    unique_customers: number;
  };
  byType: Array<{
    name: string;
    code: string;
    granted: number;
    pending: number;
    revoked: number;
  }>;
}

interface HistoryEntry {
  id: number;
  action: string;
  old_status: string | null;
  new_status: string;
  reason: string | null;
  performed_by_name: string | null;
  created_at: string;
}

export default function ConsentPage() {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [types, setTypes] = useState<ConsentType[]>([]);
  const [stats, setStats] = useState<ConsentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<ConsentRecord | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [searchQuery, statusFilter, typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, statsRes] = await Promise.all([
        fetch('/api/consent/types', { credentials: 'include' }),
        fetch('/api/consent/stats', { credentials: 'include' })
      ]);

      if (typesRes.ok) setTypes(await typesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      
      await fetchRecords();
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type_id', typeFilter);
      params.append('limit', '50');

      const res = await fetch(`/api/consent/search?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Error fetching records:', err);
    }
  };

  const fetchHistory = async (recordId: number) => {
    try {
      const res = await fetch(`/api/consent/${recordId}/history`, { credentials: 'include' });
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleRevoke = async (recordId: number, reason: string) => {
    try {
      const res = await fetch(`/api/consent/${recordId}/revoke`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        await fetchRecords();
        await fetchData();
        setSelectedRecord(null);
      }
    } catch (err) {
      console.error('Error revoking consent:', err);
    }
  };

  const handleExport = async (customerDocument: string) => {
    try {
      const res = await fetch(`/api/consent/export/${encodeURIComponent(customerDocument)}`, { 
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `consent_export_${customerDocument.replace(/\D/g, '')}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting:', err);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      granted: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Concedido' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-4 h-4" />, label: 'Pendente' },
      revoked: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-4 h-4" />, label: 'Revogado' },
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
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
            Gestão de Consentimento LGPD
          </h1>
          <p className="text-gray-500 mt-1">Gerencie consentimentos e conformidade com a Lei Geral de Proteção de Dados</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Clientes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.summary.unique_customers || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Concedidos</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats?.summary.granted_count || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats?.summary.pending_count || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Revogados</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats?.summary.revoked_count || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Taxa Opt-in</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.summary.total_records 
              ? Math.round((stats.summary.granted_count / stats.summary.total_records) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Consent by Type */}
      {stats?.byType && stats.byType.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Consentimentos por Tipo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.byType.map((type) => {
              const total = type.granted + type.pending + type.revoked;
              const grantedPercent = total ? Math.round((type.granted / total) * 100) : 0;
              return (
                <div key={type.code} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 mb-2">{type.name}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${grantedPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{grantedPercent}%</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {type.granted}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      {type.pending}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {type.revoked}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por CPF, nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Todos os Status</option>
          <option value="granted">Concedido</option>
          <option value="pending">Pendente</option>
          <option value="revoked">Revogado</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Todos os Tipos</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Base Legal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Canal</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => {
                const status = getStatusConfig(record.status);
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{record.customer_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{record.customer_document}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{record.type_name}</span>
                        {record.is_required && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Obrigatório</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600">{record.legal_basis}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">
                        {formatDate(record.status === 'granted' ? record.granted_at : record.status === 'revoked' ? record.revoked_at : record.created_at)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 capitalize">{record.collection_channel || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            fetchHistory(record.id);
                            setShowHistoryModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Ver histórico"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {record.case_id && (
                          <Link
                            to={`/cases/${record.case_id}`}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Ver caso"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleExport(record.customer_document)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Exportar dados"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {record.status === 'granted' && (
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Revogar consentimento"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum registro encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LGPD Info */}
      <div className="mt-6 bg-purple-50 rounded-xl p-5 border border-purple-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 mb-1">Conformidade LGPD</h3>
            <p className="text-sm text-purple-700 mb-3">
              Este sistema gerencia consentimentos conforme a Lei 13.709/2018 (LGPD). O titular tem direito a:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                { title: 'Acesso', desc: 'Confirmar e acessar seus dados' },
                { title: 'Correção', desc: 'Retificar dados incompletos' },
                { title: 'Eliminação', desc: 'Solicitar exclusão de dados' },
                { title: 'Revogação', desc: 'Revogar consentimento dado' },
              ].map((right) => (
                <div key={right.title} className="bg-white rounded-lg p-3 border border-purple-100">
                  <p className="font-medium text-purple-900">{right.title}</p>
                  <p className="text-xs text-purple-600">{right.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Histórico de Alterações</h2>
              <button 
                onClick={() => { setShowHistoryModal(false); setSelectedRecord(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="font-medium text-gray-900">{selectedRecord.customer_name}</p>
                <p className="text-sm text-gray-500">{selectedRecord.customer_document}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedRecord.type_name}</p>
              </div>
              
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        entry.new_status === 'granted' ? 'bg-green-100 text-green-600' :
                        entry.new_status === 'revoked' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {entry.new_status === 'granted' ? <Check className="w-4 h-4" /> :
                         entry.new_status === 'revoked' ? <X className="w-4 h-4" /> :
                         <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 capitalize">{entry.action}</p>
                        <p className="text-xs text-gray-500">
                          {entry.old_status && `${entry.old_status} → `}{entry.new_status}
                        </p>
                        {entry.reason && (
                          <p className="text-xs text-gray-600 mt-1">{entry.reason}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {entry.performed_by_name || 'Sistema'} · {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">Nenhum histórico encontrado</p>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => { setShowHistoryModal(false); setSelectedRecord(null); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {selectedRecord && !showHistoryModal && selectedRecord.status === 'granted' && (
        <RevokeModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onRevoke={handleRevoke}
        />
      )}
    </div>
  );
}

function RevokeModal({ record, onClose, onRevoke }: { 
  record: ConsentRecord; 
  onClose: () => void;
  onRevoke: (id: number, reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onRevoke(record.id, reason);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Revogar Consentimento
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-red-50 rounded-lg p-4 text-sm text-red-700">
            <p className="font-medium mb-1">Atenção</p>
            <p>Esta ação revogará o consentimento do cliente. Isso pode impactar a comunicação com este titular.</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium text-gray-900">{record.customer_name}</p>
            <p className="text-sm text-gray-500">{record.customer_document}</p>
            <p className="text-sm text-gray-600 mt-1">{record.type_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Revogação</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Descreva o motivo da revogação..."
            />
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Revogar Consentimento
          </button>
        </div>
      </div>
    </div>
  );
}
