import { useState, useEffect } from 'react';
import { Database, Table, RefreshCw, Download, ChevronDown, ChevronRight, Search, AlertCircle, Users, FileText, CreditCard, MessageSquare, Shield, Settings } from 'lucide-react';
import { useCurrentUser } from '@/react-app/hooks/useCurrentUser';
import { Navigate } from 'react-router';

interface TableStats {
  name: string;
  count: number;
  icon: React.ReactNode;
  description: string;
}

interface TableData {
  columns: string[];
  rows: any[];
  total: number;
}

const tableConfig: Record<string, { icon: React.ReactNode; description: string }> = {
  app_users: { icon: <Users className="w-4 h-4" />, description: 'Usuários do sistema' },
  roles: { icon: <Shield className="w-4 h-4" />, description: 'Perfis de acesso' },
  permissions: { icon: <Shield className="w-4 h-4" />, description: 'Permissões disponíveis' },
  role_permissions: { icon: <Shield className="w-4 h-4" />, description: 'Permissões por perfil' },
  cases: { icon: <FileText className="w-4 h-4" />, description: 'Casos de cobrança' },
  case_timeline: { icon: <FileText className="w-4 h-4" />, description: 'Histórico de eventos dos casos' },
  case_installments: { icon: <CreditCard className="w-4 h-4" />, description: 'Parcelas dos casos' },
  payments: { icon: <CreditCard className="w-4 h-4" />, description: 'Pagamentos (PIX/Boleto)' },
  journeys: { icon: <MessageSquare className="w-4 h-4" />, description: 'Réguas de comunicação' },
  journey_steps: { icon: <MessageSquare className="w-4 h-4" />, description: 'Passos das jornadas' },
  whatsapp_messages: { icon: <MessageSquare className="w-4 h-4" />, description: 'Mensagens WhatsApp' },
  whatsapp_templates: { icon: <MessageSquare className="w-4 h-4" />, description: 'Templates de mensagens' },
  risk_alerts: { icon: <AlertCircle className="w-4 h-4" />, description: 'Alertas de risco' },
  risk_rules: { icon: <AlertCircle className="w-4 h-4" />, description: 'Regras de risco' },
  supervisor_actions: { icon: <Shield className="w-4 h-4" />, description: 'Ações de supervisão' },
  consent_types: { icon: <Shield className="w-4 h-4" />, description: 'Tipos de consentimento LGPD' },
  consent_records: { icon: <Shield className="w-4 h-4" />, description: 'Registros de consentimento' },
  consent_history: { icon: <Shield className="w-4 h-4" />, description: 'Histórico de consentimento' },
  integrations: { icon: <Database className="w-4 h-4" />, description: 'Integrações configuradas' },
  webhook_endpoints: { icon: <Database className="w-4 h-4" />, description: 'Endpoints de webhook' },
  webhook_logs: { icon: <FileText className="w-4 h-4" />, description: 'Logs de webhook' },
  audit_logs: { icon: <FileText className="w-4 h-4" />, description: 'Logs de auditoria' },
  app_settings: { icon: <Settings className="w-4 h-4" />, description: 'Configurações do sistema' },
  invite_tokens: { icon: <Users className="w-4 h-4" />, description: 'Tokens de convite' },
};

export default function AdminDatabasePage() {
  const { appUser, loading: userLoading, isAdmin, hasPermission } = useCurrentUser();
  const [tables, setTables] = useState<TableStats[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Check permission - only admins and supervisors
  const canAccess = isAdmin || hasPermission('supervisor.view') || appUser?.role_name === 'Supervisor';

  useEffect(() => {
    if (canAccess) {
      fetchTableStats();
    }
  }, [canAccess]);

  const fetchTableStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/database/stats', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables.map((t: any) => ({
          ...t,
          icon: tableConfig[t.name]?.icon || <Table className="w-4 h-4" />,
          description: tableConfig[t.name]?.description || 'Tabela do sistema'
        })));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string, offset = 0) => {
    setTableLoading(true);
    try {
      const res = await fetch(`/api/admin/database/table/${tableName}?limit=${pageSize}&offset=${offset}&search=${encodeURIComponent(searchQuery)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTableData(data);
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
    } finally {
      setTableLoading(false);
    }
  };

  const handleTableClick = (tableName: string) => {
    if (selectedTable === tableName) {
      setSelectedTable(null);
      setTableData(null);
    } else {
      setSelectedTable(tableName);
      setPage(0);
      setSearchQuery('');
      fetchTableData(tableName, 0);
    }
  };

  const handleSearch = () => {
    if (selectedTable) {
      setPage(0);
      fetchTableData(selectedTable, 0);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (selectedTable) {
      fetchTableData(selectedTable, newPage * pageSize);
    }
  };

  const handleExport = async (tableName: string) => {
    try {
      const res = await fetch(`/api/admin/database/export/${tableName}`, { credentials: 'include' });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tableName}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'number' && (value === 0 || value === 1)) {
      // Could be boolean stored as integer
      return String(value);
    }
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const totalRecords = tables.reduce((acc, t) => acc + t.count, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel de Dados</h1>
              <p className="text-sm text-gray-500">Visualização administrativa do banco de dados</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Table className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
                <p className="text-xs text-gray-500">Tabelas</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalRecords.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total de Registros</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{tables.find(t => t.name === 'app_users')?.count || 0}</p>
                <p className="text-xs text-gray-500">Usuários</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{tables.find(t => t.name === 'cases')?.count || 0}</p>
                <p className="text-xs text-gray-500">Casos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={fetchTableStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Tables List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Tabelas do Banco de Dados</h2>
            <p className="text-sm text-gray-500">Clique em uma tabela para visualizar seus dados</p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Carregando tabelas...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tables.map((table) => (
                <div key={table.name}>
                  {/* Table Header */}
                  <div
                    onClick={() => handleTableClick(table.name)}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {selectedTable === table.name ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <div className="p-2 rounded-lg bg-gray-100">
                        {table.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{table.name}</p>
                        <p className="text-xs text-gray-500">{table.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        {table.count.toLocaleString()} registros
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(table.name);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Exportar CSV"
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Table Data */}
                  {selectedTable === table.name && (
                    <div className="bg-gray-50 border-t border-gray-100 p-4">
                      {/* Search */}
                      <div className="flex gap-2 mb-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Buscar em todos os campos..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={handleSearch}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Buscar
                        </button>
                      </div>

                      {tableLoading ? (
                        <div className="p-8 text-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                        </div>
                      ) : tableData && tableData.rows.length > 0 ? (
                        <>
                          {/* Data Table */}
                          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  {tableData.columns.map((col) => (
                                    <th key={col} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {tableData.rows.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    {tableData.columns.map((col) => (
                                      <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                        {formatValue(row[col])}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination */}
                          <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-gray-500">
                              Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, tableData.total)} de {tableData.total}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 0}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                              >
                                Anterior
                              </button>
                              <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={(page + 1) * pageSize >= tableData.total}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                              >
                                Próximo
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          Nenhum registro encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning Notice */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Área Administrativa</p>
              <p className="text-sm text-amber-700 mt-1">
                Esta página exibe dados sensíveis do sistema. O acesso é registrado nos logs de auditoria. 
                Os dados exibidos aqui são do ambiente de desenvolvimento. O ambiente de produção possui seu próprio banco de dados separado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
