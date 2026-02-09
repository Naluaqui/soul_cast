import { Home, Users, MessageSquare, Settings, Database, Bot, UserCog, FileText, LogOut, ChevronDown, Shield, ShieldCheck, Table2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useCurrentUser } from '@/react-app/hooks/useCurrentUser';
import { useState } from 'react';

const baseNavigation = [
  { name: 'Dashboard', icon: Home, href: '/dashboard' },
  { name: 'Casos', icon: Users, href: '/cases' },
  { name: 'Régua de Comunicação', icon: MessageSquare, href: '/journey' },
  { name: 'Integrações', icon: Database, href: '/integrations' },
  { name: 'Agentes IA', icon: Bot, href: '/agents' },
  { name: 'Supervisor', icon: Shield, href: '/supervisor' },
  { name: 'LGPD', icon: ShieldCheck, href: '/consent' },
  { name: 'Usuários', icon: UserCog, href: '/users' },
  { name: 'Logs / Auditoria', icon: FileText, href: '/logs' },
  { name: 'Configurações', icon: Settings, href: '/settings' }
];

const adminNavigation = [
  { name: 'Painel de Dados', icon: Table2, href: '/admin/database' }
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin, hasPermission, appUser: currentAppUser } = useCurrentUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Show admin menu for admins and supervisors
  const canAccessAdminDatabase = isAdmin || hasPermission('supervisor.view') || currentAppUser?.role_name === 'Supervisor';
  
  // Build navigation based on permissions
  const navigation = canAccessAdminDatabase 
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get user info from the extended user object
  const appUser = (user as any)?.appUser;
  const displayName = appUser?.name || user?.google_user_data?.name || user?.email?.split('@')[0] || 'Usuário';
  const avatarUrl = appUser?.avatar_url || user?.google_user_data?.picture;
  const roleName = appUser?.role_name || 'Operador';
  const roleColor = appUser?.role_color || 'gray';

  const roleColorClasses: Record<string, string> = {
    red: 'bg-red-500/20 text-red-300',
    purple: 'bg-purple-500/20 text-purple-300',
    blue: 'bg-blue-500/20 text-blue-300',
    green: 'bg-green-500/20 text-green-300',
    gray: 'bg-gray-500/20 text-gray-300',
  };
  
  return (
    <div className="flex flex-col w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 border-r border-gray-800">
      <div className="flex items-center gap-3 p-6 border-b border-gray-800">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-xl">S</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Soul Collect</h1>
          <p className="text-xs text-gray-400">Gestão Inteligente</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-3 flex items-center gap-3 transition-colors"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                {displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${roleColorClasses[roleColor]}`}>
                {roleName}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
              <div className="p-3 border-b border-gray-700">
                <p className="text-xs text-gray-400">Logado como</p>
                <p className="text-sm text-white truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
