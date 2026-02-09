import { useState, useRef } from 'react';
import { Plus, Download, Upload, RefreshCw, Search, Filter, X, Loader2, Trash2, FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import CaseCard from '@/react-app/components/CaseCard';
import { useCases, useCaseStats, caseStatusLabels, type CaseStatus } from '@/react-app/hooks/useCases';

export default function CasesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { cases, loading, refetch, createCase, deleteCase } = useCases({
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const { stats } = useCaseStats();

  // New case form state
  const [newCase, setNewCase] = useState({
    customer_name: '',
    customer_document: '',
    customer_phone: '',
    customer_email: '',
    contract_id: '',
    contract_type: '',
    total_debt: '',
    days_overdue: '0',
    has_consent: true,
  });
  const [creating, setCreating] = useState(false);

  const handleCreateCase = async () => {
    if (!newCase.customer_name || !newCase.total_debt) {
      alert('Nome do cliente e valor da dívida são obrigatórios');
      return;
    }
    setCreating(true);
    try {
      const result = await createCase({
        customer_name: newCase.customer_name,
        customer_document: newCase.customer_document || null,
        customer_phone: newCase.customer_phone || null,
        customer_email: newCase.customer_email || null,
        contract_id: newCase.contract_id || null,
        contract_type: newCase.contract_type || null,
        total_debt: parseFloat(newCase.total_debt),
        days_overdue: parseInt(newCase.days_overdue) || 0,
        has_consent: newCase.has_consent ? 1 : 0,
      } as any);
      setShowNewCaseModal(false);
      setNewCase({
        customer_name: '',
        customer_document: '',
        customer_phone: '',
        customer_email: '',
        contract_id: '',
        contract_type: '',
        total_debt: '',
        days_overdue: '0',
        has_consent: true,
      });
      navigate(`/cases/${result.case_number}`);
    } catch (err) {
      alert('Erro ao criar caso');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCase = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este caso?')) return;
    try {
      await deleteCase(id);
    } catch (err) {
      alert('Erro ao excluir caso');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/cases/export', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `casos_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Erro ao exportar casos');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      let cases: any[] = [];

      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        cases = Array.isArray(data) ? data : data.cases || [];
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].match(/("([^"]*)"|[^,]+)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
          const caseObj: any = {};
          headers.forEach((h, idx) => {
            const key = h.toLowerCase()
              .replace('número do caso', 'case_number')
              .replace('cliente', 'customer_name')
              .replace('cpf/cnpj', 'customer_document')
              .replace('telefone', 'customer_phone')
              .replace('email', 'customer_email')
              .replace('contrato', 'contract_id')
              .replace('tipo contrato', 'contract_type')
              .replace('valor dívida', 'total_debt')
              .replace('dias em atraso', 'days_overdue')
              .replace('notas', 'notes');
            caseObj[key] = values[idx] || '';
          });
          if (caseObj.customer_name || caseObj.nome) {
            cases.push(caseObj);
          }
        }
      }

      const response = await fetch('/api/cases/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cases }),
      });

      const result = await response.json();
      setImportResult(result);
      if (result.imported > 0) {
        refetch();
      }
    } catch (err: any) {
      setImportResult({ imported: 0, errors: [err.message || 'Erro ao processar arquivo'] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
  };

  const hasActiveFilters = search || statusFilter;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carteira de Casos</h1>
          <p className="text-gray-500 mt-1">Gerencie e acompanhe todos os casos de cobrança</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar
          </button>
          <button 
            onClick={() => setShowNewCaseModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Caso
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total em Carteira</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            R$ {(stats?.total_debt || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Em Negociação</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {stats?.negotiating_count || 0} casos
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Com Promessa</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {stats?.promised_count || 0} casos
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Sem Consentimento</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {stats?.without_consent_count || 0} casos
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, documento ou contrato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            {Object.entries(caseStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {cases.length} caso{cases.length !== 1 ? 's' : ''} encontrado{cases.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum caso encontrado</h3>
          <p className="text-gray-500 mb-4">Ajuste os filtros ou crie um novo caso</p>
          <button 
            onClick={() => setShowNewCaseModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Novo Caso
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map(caseItem => (
            <div key={caseItem.id} className="relative group">
              <CaseCard caseItem={{
                id: caseItem.case_number,
                customerId: `CUST-${caseItem.id}`,
                customerName: caseItem.customer_name,
                customerDocument: caseItem.customer_document || '',
                customerPhone: caseItem.customer_phone || '',
                customerEmail: caseItem.customer_email || '',
                contractId: caseItem.contract_id || '',
                contractType: caseItem.contract_type || '',
                totalDebt: caseItem.total_debt,
                daysOverdue: caseItem.days_overdue,
                status: caseItem.status as CaseStatus,
                lastContactChannel: (caseItem.last_contact_channel || 'whatsapp') as any,
                lastContactDate: caseItem.last_contact_at ? new Date(caseItem.last_contact_at) : null,
                nextActionDate: caseItem.next_action_at ? new Date(caseItem.next_action_at) : new Date(),
                assignedOperator: caseItem.assigned_operator_name || '',
                riskScore: caseItem.risk_score,
                hasConsent: caseItem.has_consent === 1,
                installmentsOverdue: caseItem.installments_overdue,
                totalInstallments: caseItem.total_installments,
                createdAt: new Date(caseItem.created_at),
              }} />
              <button
                onClick={(e) => handleDeleteCase(caseItem.id, e)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Importar Casos</h2>
              <button 
                onClick={() => { setShowImportModal(false); setImportResult(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {!importResult ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <FileUp className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Selecione um arquivo</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Formatos suportados: CSV ou JSON.<br />
                    O arquivo deve conter os campos: nome, documento, telefone, email, valor da dívida.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={handleImportFile}
                    className="hidden"
                    id="import-file"
                  />
                  <label
                    htmlFor="import-file"
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Escolher Arquivo
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="text-center">
                  {importResult.imported > 0 ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">Importação Concluída!</h3>
                      <p className="text-sm text-gray-500">
                        {importResult.imported} caso{importResult.imported !== 1 ? 's' : ''} importado{importResult.imported !== 1 ? 's' : ''} com sucesso.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">Erro na Importação</h3>
                    </>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-4 text-left bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <p className="text-xs font-medium text-red-700 mb-1">Erros ({importResult.errors.length}):</p>
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <p key={i} className="text-xs text-red-600">{err}</p>
                      ))}
                      {importResult.errors.length > 5 && (
                        <p className="text-xs text-red-500 mt-1">...e mais {importResult.errors.length - 5} erros</p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => { setShowImportModal(false); setImportResult(null); }}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Case Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Novo Caso</h2>
              <button 
                onClick={() => setShowNewCaseModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  value={newCase.customer_name}
                  onChange={(e) => setNewCase({ ...newCase, customer_name: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={newCase.customer_document}
                    onChange={(e) => setNewCase({ ...newCase, customer_document: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={newCase.customer_phone}
                    onChange={(e) => setNewCase({ ...newCase, customer_phone: e.target.value })}
                    placeholder="+55 11 99999-9999"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newCase.customer_email}
                  onChange={(e) => setNewCase({ ...newCase, customer_email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº Contrato</label>
                  <input
                    type="text"
                    value={newCase.contract_id}
                    onChange={(e) => setNewCase({ ...newCase, contract_id: e.target.value })}
                    placeholder="CTR-2024-001"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                  <select
                    value={newCase.contract_type}
                    onChange={(e) => setNewCase({ ...newCase, contract_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Financiamento Veículo">Financiamento Veículo</option>
                    <option value="Financiamento Imóvel">Financiamento Imóvel</option>
                    <option value="Empréstimo Consignado">Empréstimo Consignado</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Dívida *</label>
                  <input
                    type="number"
                    value={newCase.total_debt}
                    onChange={(e) => setNewCase({ ...newCase, total_debt: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dias em Atraso</label>
                  <input
                    type="number"
                    value={newCase.days_overdue}
                    onChange={(e) => setNewCase({ ...newCase, days_overdue: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasConsent"
                  checked={newCase.has_consent}
                  onChange={(e) => setNewCase({ ...newCase, has_consent: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hasConsent" className="text-sm text-gray-700">
                  Cliente possui consentimento LGPD para contato
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCase}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Criar Caso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
