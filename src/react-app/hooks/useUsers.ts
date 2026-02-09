import { useState, useEffect, useCallback } from 'react';

export interface AppUser {
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
  last_active_at: string | null;
  login_count: number;
  invited_by_id: number | null;
  invited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  color: string;
  is_system: boolean;
  user_count: number;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  description: string;
  group_name: string;
}

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const inviteUser = async (email: string, name: string, roleId: number) => {
    const res = await fetch('/api/admin/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, name, role_id: roleId }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to invite user');
    }
    await fetchUsers();
  };

  const createInviteLink = async (email: string, name: string, roleId: number, corporateEmail?: string) => {
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        email: email || null, 
        name, 
        role_id: roleId,
        corporate_email: corporateEmail || null
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create invite');
    }
    const data = await res.json();
    return {
      token: data.token,
      inviteLink: data.invite_link,
      expiresAt: data.expires_at
    };
  };

  const updateUser = async (id: number, updates: Partial<AppUser>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update user');
    }
    await fetchUsers();
  };

  const deleteUser = async (id: number) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete user');
    }
    await fetchUsers();
  };

  return { users, loading, error, fetchUsers, inviteUser, createInviteLink, updateUser, deleteUser };
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/roles', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = async (name: string, description: string, color: string, permissions: string[]) => {
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, description, color, permissions }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create role');
    }
    await fetchRoles();
  };

  const updateRole = async (id: number, updates: Partial<Role> & { permissions?: string[] }) => {
    const res = await fetch(`/api/admin/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update role');
    }
    await fetchRoles();
  };

  const deleteRole = async (id: number) => {
    const res = await fetch(`/api/admin/roles/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete role');
    }
    await fetchRoles();
  };

  return { roles, loading, error, fetchRoles, createRole, updateRole, deleteRole };
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await fetch('/api/admin/permissions', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch permissions');
        const data = await res.json();
        setPermissions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  // Group permissions by group_name
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.group_name]) {
      acc[perm.group_name] = [];
    }
    acc[perm.group_name].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return { permissions, groupedPermissions, loading };
}
