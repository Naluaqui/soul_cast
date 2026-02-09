import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@getmocha/users-service/react';

export interface AppUserData {
  id: number;
  mocha_user_id: string | null;
  email: string;
  name: string;
  avatar_url: string | null;
  role_id: number;
  role_name: string;
  role_color: string;
  status: 'active' | 'inactive' | 'pending';
  is_mfa_enabled: boolean;
  is_owner: boolean;
  permissions: string[];
  last_active_at: string | null;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export interface CurrentUserContextValue {
  appUser: AppUserData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAdmin: boolean;
  isOwner: boolean;
  canEditConfig: boolean;
  canManageAdmins: boolean;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { user: mochaUser, isPending: authPending } = useAuth();
  const [appUser, setAppUser] = useState<AppUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    if (!mochaUser) {
      setAppUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/users/me', { credentials: 'include' });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        
        // Erro de autorização - usuário não está cadastrado
        if (res.status === 403 || errorData.unauthorized) {
          setError(errorData.error || 'Seu email não está autorizado a acessar este sistema.');
          setAppUser(null);
          return;
        }
        
        throw new Error(errorData.error || 'Falha ao carregar dados do usuário');
      }
      
      const data = await res.json();
      
      // Verificar se realmente temos um appUser
      if (!data.appUser) {
        setError('Usuário não encontrado no sistema. Solicite acesso ao administrador.');
        setAppUser(null);
        return;
      }
      
      setAppUser(data.appUser);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setAppUser(null);
    } finally {
      setLoading(false);
    }
  }, [mochaUser]);

  useEffect(() => {
    if (!authPending) {
      fetchCurrentUser();
    }
  }, [authPending, fetchCurrentUser]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!appUser) return false;
    if (appUser.is_owner || appUser.role_name === 'Administrador') return true;
    return appUser.permissions.includes(permission);
  }, [appUser]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p));
  }, [hasPermission]);

  const isAdmin = appUser?.role_name === 'Administrador' || appUser?.is_owner === true;
  const isOwner = appUser?.is_owner === true;
  const canEditConfig = isOwner || isAdmin;
  const canManageAdmins = isOwner;

  const contextValue: CurrentUserContextValue = {
    appUser,
    loading: authPending || loading,
    error,
    refresh: fetchCurrentUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isOwner,
    canEditConfig,
    canManageAdmins,
  };

  return (
    <CurrentUserContext.Provider value={contextValue}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return context;
}

export function usePermissionCheck(permission: string): [boolean, string | null] {
  const { appUser, loading, hasPermission } = useCurrentUser();
  
  if (loading) return [false, 'Carregando...'];
  if (!appUser) return [false, 'Usuário não autenticado'];
  if (!hasPermission(permission)) {
    return [false, 'Você não tem permissão para realizar esta ação'];
  }
  return [true, null];
}
