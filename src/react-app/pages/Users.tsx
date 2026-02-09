import { useState } from 'react';
import { 
  Plus, Search, MoreVertical, Shield, Users as UsersIcon,
  Mail, Clock, CheckCircle, XCircle, Edit, Trash2,
  ChevronDown, ChevronRight, Lock, Unlock, UserPlus, Key,
  Eye, Settings, Database, MessageSquare, Zap, FileText, AlertTriangle, X, Loader2,
  Copy, Check, Link
} from 'lucide-react';
import { useUsers, useRoles, usePermissions, type AppUser, type Role } from '@/react-app/hooks/useUsers';

type TabType = 'users' | 'roles' | 'permissions';

export default function UsersPage() {
  const { users, loading: usersLoading, createInviteLink, updateUser, deleteUser } = useUsers();
  const { roles, loading: rolesLoading } = useRoles();
  const { groupedPermissions, loading: permsLoading } = usePermissions();

  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchUsers, setSearchUsers] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Casos', 'Agentes IA']);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteCorporateEmail, setInviteCorporateEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState<number>(4);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h atrás`;
    return `${Math.floor(minutes / 1440)}d atrás`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    const labels: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      pending: 'Pendente',
    };
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getRoleBadge = (user: AppUser) => {
    const colors: Record<string, string> = {
      red: 'bg-red-100 text-red-700 border-red-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      gray: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${colors[user.role_color || 'gray']}`}>
        {user.role_name || 'Sem papel'}
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const handleInvite = async () => {
    if (!inviteName) {
      setInviteError('Nome é obrigatório');
      return;
    }
    setInviteLoading(true);
    setInviteError('');
    setInviteLink('');
    try {
      const result = await createInviteLink(inviteEmail, inviteName, inviteRoleId, inviteCorporateEmail);
      setInviteLink(result.inviteLink);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Erro ao criar convite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá ${inviteName}! Você foi convidado para acessar o Soul Collect. Clique no link para começar: ${inviteLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteName('');
    setInviteCorporateEmail('');
    setInviteRoleId(4);
    setInviteLink('');
    setInviteError('');
    setLinkCopied(false);
  };

  const handleToggleStatus = async (user: AppUser) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateUser(user.id, { status: newStatus } as any);
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (!confirm(`Tem certeza que deseja remover ${user.name}?`)) return;
    try {
      await deleteUser(user.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover usuário');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchUsers.toLowerCase());
    const matchesRole = !filterRole || user.role_name === filterRole;
    const matchesStatus = !filterStatus || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const tabs = [
    { id: 'users' as TabType, label: 'Usuários', icon: UsersIcon },
    { id: 'roles' as TabType, label: 'Papéis', icon: Shield },
    { id: 'permissions' as TabType, label: 'Permissões', icon: Key },
  ];

  const groupIcons: Record<string, React.ReactNode> = {
    'Casos': <FileText className="w-5 h-5" />,
    'Dashboard': <Eye className="w-5 h-5" />,
    'Relatórios': <FileText className="w-5 h-5" />,
    'Agentes IA': <Zap className="w-5 h-5" />,
    'Integrações': <Database className="w-5 h-5" />,
    'Comunicação': <MessageSquare className="w-5 h-5" />,
    'Administração': <Settings className="w-5 h-5" />,
  };

  const loading = usersLoading || rolesLoading || permsLoading;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários e Permissões</h1>
          <p className="text-gray-500 mt-1">Gerencie acessos e controle de permissões RBAC</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Convidar Usuário
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-500">Total de Usuários</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.status === 'active').length}</p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
              <p className="text-sm text-gray-500">Papéis</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => !u.is_mfa_enabled && u.status === 'active').length}</p>
              <p className="text-sm text-gray-500">Sem MFA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os papéis</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {filteredUsers.length === 0 ? (
                  <div className="p-12 text-center">
                    <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum usuário encontrado</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Usuário</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Papel</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">MFA</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Último Acesso</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                                  {getInitials(user.name || user.email)}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{user.name || user.email.split('@')[0]}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Mail className="w-3.5 h-3.5" />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {getRoleBadge(user)}
                          </td>
                          <td className="px-5 py-4">
                            {getStatusBadge(user.status)}
                          </td>
                          <td className="px-5 py-4">
                            {user.is_mfa_enabled ? (
                              <span className="flex items-center gap-1.5 text-green-600 text-sm">
                                <Lock className="w-4 h-4" />
                                Ativo
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                                <Unlock className="w-4 h-4" />
                                Inativo
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(user.last_active_at)}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                <Key className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleStatus(user)}
                                className={`p-2 rounded-lg ${
                                  user.status === 'active'
                                    ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                }`}
                              >
                                {user.status === 'active' ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button 
                                onClick={() => handleDelete(user)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Configure papéis e suas permissões associadas</p>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Plus className="w-4 h-4" />
                  Criar Papel
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <div 
                    key={role.id} 
                    className={`bg-white rounded-xl border p-5 cursor-pointer transition-all ${
                      selectedRole?.id === role.id 
                        ? 'border-blue-500 ring-2 ring-blue-100' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          role.color === 'red' ? 'bg-red-100' :
                          role.color === 'purple' ? 'bg-purple-100' :
                          role.color === 'blue' ? 'bg-blue-100' :
                          role.color === 'green' ? 'bg-green-100' :
                          'bg-gray-100'
                        }`}>
                          <Shield className={`w-5 h-5 ${
                            role.color === 'red' ? 'text-red-600' :
                            role.color === 'purple' ? 'text-purple-600' :
                            role.color === 'blue' ? 'text-blue-600' :
                            role.color === 'green' ? 'text-green-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{role.name}</h3>
                            {role.is_system ? (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Sistema</span>
                            ) : null}
                          </div>
                          <p className="text-sm text-gray-500">{role.user_count} usuário{role.user_count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {!role.is_system && (
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        {role.permissions.length} permissões
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        Ver detalhes <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Role Details Panel */}
              {selectedRole && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Permissões do papel: {selectedRole.name}</h3>
                    {!selectedRole.is_system && (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {selectedRole.permissions.map((perm) => (
                      <span key={perm} className="text-xs bg-blue-50 text-blue-700 px-2 py-1.5 rounded">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Visualize todas as permissões disponíveis no sistema</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {Object.entries(groupedPermissions).map(([groupName, perms]) => (
                  <div key={groupName}>
                    <button
                      onClick={() => toggleGroup(groupName)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          {groupIcons[groupName] || <Settings className="w-5 h-5" />}
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium text-gray-900">{groupName}</h3>
                          <p className="text-sm text-gray-500">{perms.length} permissões</p>
                        </div>
                      </div>
                      {expandedGroups.includes(groupName) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {expandedGroups.includes(groupName) && (
                      <div className="px-4 pb-4">
                        <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
                          {perms.map((permission) => (
                            <div key={permission.id} className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <code className="text-xs bg-white border border-gray-200 px-2 py-1 rounded font-mono text-gray-700">
                                  {permission.code}
                                </code>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                                  <p className="text-xs text-gray-500">{permission.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {roles.filter(r => r.permissions.includes(permission.code)).map(role => (
                                  <span 
                                    key={role.id}
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      role.color === 'red' ? 'bg-red-100 text-red-700' :
                                      role.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                      role.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                      role.color === 'green' ? 'bg-green-100 text-green-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}
                                    title={role.name}
                                  >
                                    {role.name.substring(0, 3)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* LGPD Compliance Note */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-1">Conformidade LGPD</h3>
                    <p className="text-sm text-purple-700 mb-3">
                      O sistema de permissões RBAC garante que apenas usuários autorizados acessem dados pessoais. 
                      Todas as ações são registradas no log de auditoria para fins de compliance.
                    </p>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                        Ver Política de Dados
                      </button>
                      <button className="px-4 py-2 bg-white text-purple-700 text-sm rounded-lg border border-purple-200 hover:bg-purple-50">
                        Relatório de Acessos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {inviteLink ? 'Link de Convite Gerado' : 'Convidar Usuário'}
              </h2>
              <button 
                onClick={handleCloseInviteModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {inviteLink ? (
              // Success state - show the generated link
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-1">Convite criado com sucesso!</h3>
                  <p className="text-sm text-gray-500">
                    Compartilhe o link abaixo com <strong>{inviteName}</strong>
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Link de Convite</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`p-2 rounded-lg transition-colors ${
                        linkCopied 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Copiar link"
                    >
                      {linkCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Compartilhar no WhatsApp
                  </button>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Link copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Link
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  O link expira em 7 dias. O usuário precisará fazer login com Google 
                  {inviteCorporateEmail && ` e confirmar o email corporativo ${inviteCorporateEmail}`}.
                </p>
              </div>
            ) : (
              // Form state
              <>
                <div className="p-5 space-y-4">
                  {inviteError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      {inviteError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Nome do usuário"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Corporativo Prospera
                    </label>
                    <input
                      type="email"
                      value={inviteCorporateEmail}
                      onChange={(e) => setInviteCorporateEmail(e.target.value)}
                      placeholder="usuario@meuprospera.com.br"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      O usuário precisará confirmar este email após fazer login com Google
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Google (opcional)</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@gmail.com"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se informado, apenas este email Google poderá usar o convite
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
                    <select
                      value={inviteRoleId}
                      onChange={(e) => setInviteRoleId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
                  <button
                    onClick={handleCloseInviteModal}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviteLoading || !inviteName}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inviteLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link className="w-4 h-4" />
                    )}
                    Gerar Link de Convite
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
