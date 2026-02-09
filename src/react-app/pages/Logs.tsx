import { useState, useMemo } from 'react';
import { Search, Download, RefreshCw, User, Shield, Database, CheckCircle, Info, Loader2, Eye, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuditLogs } from '@/react-app/hooks/useAuditLogs';

export default function LogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);

  const { logs, loading, refetch } = useAuditLogs({
    action: actionFilter || undefined,
    limit,
    offset,
  });

  const filteredLogs = useMemo(() => {
    if (!search) return logs;
    const searchLower = search.toLowerCase();
    return logs.filter(log => 
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_type?.toLowerCase().includes(searchLower) ||
      log.user_name?.toLowerCase().includes(searchLower) ||
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.entity_id?.toLowerCase().includes(searchLower)
    );
  }, [logs, search]);

  const getActionIcon = (action: string) => {
    if (action.includes('created') || action.includes('invited')) return <UserPlus className="w-4 h-4" />;
    if (action.includes('updated')) return <Pencil className="w-4 h-4" />;
    if (action.includes('deleted')) return <Trash2 className="w-4 h-4" />;
    if (action.includes('login') || action.includes('view')) return <Eye className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  const getActionStyle = (action: string) => {
    if (action.includes('created') || action.includes('invited')) return 'bg-green-100 text-green-700';
    if (action.includes('updated')) return 'bg-blue-100 text-blue-700';
    if (action.includes('deleted')) return 'bg-red-100 text-red-700';
    if (action.includes('login')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'user_created': 'Usuário Criado',
      'user_invited': 'Usuário Convidado',
      'user_updated': 'Usuário Atualizado',
      'user_deleted': 'Usuário Removido',
      'role_created': 'Papel Criado',
      'role_updated': 'Papel Atualizado',
      'role_deleted': 'Papel Removido',
      'login': 'Login',
      'logout': 'Logout',
    };
    return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEntityLabel = (type: string | null) => {
    if (!type) return '-';
    const labels: Record<string, string> = {
      'app_users': 'Usuários',
      'roles': 'Papéis',
      'cases': 'Casos',
      'integrations': 'Integrações',
    };
    return labels[type] || type;
  };

  const formatDetails = (log: any) => {
    const newValues = log.new_values ? JSON.parse(log.new_values) : null;
    const oldValues = log.old_values ? JSON.parse(log.old_values) : null;

    if (newValues?.email) {
      return `Email: ${newValues.email}`;
    }
    if (newValues?.role_id) {
      return `Papel ID: ${newValues.role_id}`;
    }
    if (newValues?.status) {
      return `Status: ${newValues.status}`;
    }
    if (oldValues?.email) {
      return `Email: ${oldValues.email}`;
    }
    return '-';
  };

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = logs.filter(log => new Date(log.created_at) >= today);
    const userActions = logs.filter(log => log.action.includes('user'));
    const securityLogs = logs.filter(log => log.action.includes('login') || log.action.includes('logout'));
    
    return {
      total: todayLogs.length,
      userActions: userActions.length,
      security: securityLogs.length,
    };
  }, [logs]);

  const uniqueActions = useMemo(() => {
    return [...new Set(logs.map(log => log.action))];
  }, [logs]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs e Auditoria</h1>
          <p className="text-gray-500 mt-1">Histórico completo de ações e eventos do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
              <p className="text-sm text-gray-500">Total Registros</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.userActions}</p>
              <p className="text-sm text-gray-500">Ações de Usuário</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.security}</p>
              <p className="text-sm text-gray-500">Segurança</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.total}</p>
              <p className="text-sm text-gray-500">Hoje</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar em logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setOffset(0);
          }}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as ações</option>
          {uniqueActions.map(action => (
            <option key={action} value={action}>{getActionLabel(action)}</option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum log encontrado</p>
          <p className="text-sm text-gray-400 mt-1">Os logs de auditoria aparecerão aqui conforme as ações são realizadas no sistema</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Horário</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ação</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Usuário</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Entidade</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono whitespace-nowrap">
                    {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${getActionStyle(log.action)}`}>
                      {getActionIcon(log.action)}
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.user_name ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.user_name}</p>
                        <p className="text-xs text-gray-500">{log.user_email}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sistema</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {getEntityLabel(log.entity_type)}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">
                    {log.entity_id || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {formatDetails(log)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">Mostrando {filteredLogs.length} registros</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1.5 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg">
              {Math.floor(offset / limit) + 1}
            </button>
            <button 
              onClick={() => setOffset(offset + limit)}
              disabled={filteredLogs.length < limit}
              className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* LGPD Note */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 mb-1">Conformidade LGPD - Auditoria</h3>
            <p className="text-sm text-purple-700">
              Todos os acessos e modificações de dados pessoais são registrados automaticamente neste log. 
              Os registros são mantidos por 5 anos conforme exigência legal e podem ser exportados para fins de auditoria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
