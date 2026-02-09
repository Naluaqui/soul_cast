
-- Roles table (predefined roles for the system)
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT 'gray',
  is_system BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  group_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

-- App users (linked to Mocha auth)
CREATE TABLE app_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mocha_user_id TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  role_id INTEGER,
  status TEXT DEFAULT 'pending',
  is_mfa_enabled BOOLEAN DEFAULT 0,
  last_active_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  invited_by_id INTEGER,
  invited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_mocha_user_id ON app_users(mocha_user_id);
CREATE INDEX idx_app_users_role_id ON app_users(role_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Seed default roles
INSERT INTO roles (name, description, color, is_system) VALUES 
  ('Administrador', 'Acesso total ao sistema, incluindo configurações e gestão de usuários', 'red', 1),
  ('Supervisor', 'Gerencia equipe de operadores, aprova ações e visualiza relatórios', 'purple', 1),
  ('Analista', 'Acesso a relatórios, dashboards e análises de dados', 'blue', 0),
  ('Operador', 'Trabalha nos casos, entra em contato com clientes e registra ações', 'green', 1),
  ('Somente Leitura', 'Visualiza informações sem poder realizar alterações', 'gray', 0);

-- Seed permissions
INSERT INTO permissions (code, name, description, group_name) VALUES
  ('cases.view', 'Visualizar casos', 'Ver lista e detalhes dos casos', 'Casos'),
  ('cases.edit', 'Editar casos', 'Modificar informações dos casos', 'Casos'),
  ('cases.create', 'Criar casos', 'Adicionar novos casos manualmente', 'Casos'),
  ('cases.delete', 'Excluir casos', 'Remover casos do sistema', 'Casos'),
  ('cases.assign', 'Atribuir casos', 'Distribuir casos para operadores', 'Casos'),
  ('cases.contact', 'Contatar cliente', 'Enviar mensagens e realizar ligações', 'Casos'),
  ('cases.negotiate', 'Negociar', 'Criar propostas e acordos', 'Casos'),
  ('cases.approve', 'Aprovar acordos', 'Aprovar descontos e condições especiais', 'Casos'),
  ('dashboard.view', 'Visualizar dashboard', 'Ver métricas e KPIs', 'Dashboard'),
  ('dashboard.export', 'Exportar dados', 'Baixar relatórios do dashboard', 'Dashboard'),
  ('reports.view', 'Visualizar relatórios', 'Acessar relatórios analíticos', 'Relatórios'),
  ('reports.create', 'Criar relatórios', 'Construir relatórios personalizados', 'Relatórios'),
  ('reports.export', 'Exportar relatórios', 'Baixar relatórios em PDF/Excel', 'Relatórios'),
  ('ai.use', 'Usar copiloto', 'Interagir com o assistente IA', 'Agentes IA'),
  ('ai.approve', 'Aprovar ações IA', 'Validar sugestões automáticas', 'Agentes IA'),
  ('ai.configure', 'Configurar IA', 'Ajustar parâmetros e prompts', 'Agentes IA'),
  ('integrations.view', 'Visualizar integrações', 'Ver status das conexões', 'Integrações'),
  ('integrations.configure', 'Configurar integrações', 'Editar conexões e webhooks', 'Integrações'),
  ('admin.users', 'Gerenciar usuários', 'Criar, editar e remover usuários', 'Administração'),
  ('admin.roles', 'Gerenciar papéis', 'Configurar permissões e papéis', 'Administração'),
  ('admin.audit', 'Ver auditoria', 'Acessar logs de auditoria', 'Administração'),
  ('admin.settings', 'Configurações gerais', 'Alterar configurações do sistema', 'Administração');

-- Assign permissions to roles
-- Administrador gets all permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions;

-- Supervisor
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 2, id FROM permissions WHERE code IN ('cases.view', 'cases.edit', 'cases.assign', 'cases.approve', 'dashboard.view', 'reports.view', 'reports.export', 'ai.use', 'ai.approve', 'admin.audit');

-- Analista
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 3, id FROM permissions WHERE code IN ('cases.view', 'dashboard.view', 'dashboard.export', 'reports.view', 'reports.create', 'reports.export');

-- Operador
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 4, id FROM permissions WHERE code IN ('cases.view', 'cases.edit', 'cases.contact', 'cases.negotiate', 'dashboard.view', 'ai.use');

-- Somente Leitura
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 5, id FROM permissions WHERE code IN ('cases.view', 'dashboard.view');
