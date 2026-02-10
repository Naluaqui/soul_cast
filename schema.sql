-- schema.sql

-- 1. Tabelas de Usuários e Permissões
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'gray',
    is_system BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    group_name TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER,
    permission_id INTEGER,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE IF NOT EXISTS app_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mocha_user_id TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    role_id INTEGER,
    is_owner BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, inactive, pending
    is_mfa_enabled BOOLEAN DEFAULT 0,
    last_active_at DATETIME,
    login_count INTEGER DEFAULT 0,
    invited_by_id INTEGER,
    invited_at DATETIME,
    corporate_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS invite_tokens (
    token TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    role_id INTEGER,
    invited_by_id INTEGER,
    expires_at DATETIME,
    used_at DATETIME,
    corporate_email TEXT,
    requires_validation BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. COBRANÇA (CASES, PAGAMENTOS)
CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_number TEXT UNIQUE,
    customer_name TEXT,
    customer_document TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    contract_id TEXT,
    contract_type TEXT,
    total_debt REAL DEFAULT 0,
    days_overdue INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new',
    last_contact_channel TEXT,
    last_contact_at DATETIME,
    next_action_at DATETIME,
    assigned_operator_name TEXT,
    risk_score INTEGER DEFAULT 50,
    has_consent BOOLEAN DEFAULT 0,
    installments_overdue INTEGER DEFAULT 0,
    total_installments INTEGER DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS case_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER,
    event_type TEXT, -- system, contact, payment, note, status
    title TEXT,
    description TEXT,
    channel TEXT,
    user_name TEXT,
    metadata TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id)
);

CREATE TABLE IF NOT EXISTS case_installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER,
    installment_number INTEGER,
    amount REAL,
    due_date DATETIME,
    status TEXT, -- pending, paid, overdue
    paid_amount REAL,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id)
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER,
    payment_type TEXT, -- pix, boleto
    amount REAL,
    status TEXT DEFAULT 'pending', -- pending, paid, expired, cancelled
    due_date DATETIME,
    paid_at DATETIME,
    pix_code TEXT,
    pix_qr_data TEXT,
    boleto_barcode TEXT,
    boleto_line TEXT,
    boleto_bank TEXT,
    external_id TEXT,
    metadata TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id)
);

-- 3. JORNADAS E WHATSAPP
CREATE TABLE IF NOT EXISTS journeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    trigger_conditions TEXT, -- JSON
    cases_active INTEGER DEFAULT 0,
    conversion_rate REAL DEFAULT 0,
    created_by_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journey_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER,
    step_order INTEGER,
    day_offset INTEGER,
    channel TEXT,
    action_type TEXT,
    action_title TEXT,
    template_content TEXT,
    conditions TEXT, -- JSON
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    content TEXT,
    variables TEXT, -- JSON array
    language TEXT DEFAULT 'pt_BR',
    status TEXT DEFAULT 'pending',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER,
    direction TEXT, -- inbound, outbound
    phone_number TEXT,
    message_type TEXT,
    template_name TEXT,
    content TEXT,
    status TEXT, -- sent, delivered, read, failed, received
    whatsapp_message_id TEXT,
    sent_at DATETIME,
    delivered_at DATETIME,
    read_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. RISCO E SUPERVISÃO
CREATE TABLE IF NOT EXISTS risk_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER,
    alert_type TEXT,
    severity TEXT, -- low, medium, high, critical
    title TEXT,
    description TEXT,
    risk_score INTEGER,
    is_resolved BOOLEAN DEFAULT 0,
    resolved_at DATETIME,
    resolution_notes TEXT,
    is_acknowledged BOOLEAN DEFAULT 0,
    acknowledged_at DATETIME,
    auto_generated BOOLEAN DEFAULT 1,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    rule_type TEXT,
    conditions TEXT, -- JSON
    severity TEXT,
    alert_template TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supervisor_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id INTEGER,
    case_id INTEGER,
    action_type TEXT,
    description TEXT,
    priority TEXT,
    status TEXT DEFAULT 'pending',
    assigned_to_id INTEGER,
    assigned_to_name TEXT,
    due_at DATETIME,
    completed_at DATETIME,
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. LGPD
CREATE TABLE IF NOT EXISTS consent_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    code TEXT,
    legal_basis TEXT,
    is_required BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS consent_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER,
    customer_document TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    consent_type_id INTEGER,
    status TEXT, -- pending, granted, revoked
    granted_at DATETIME,
    revoked_at DATETIME,
    collection_method TEXT,
    collection_channel TEXT,
    ip_address TEXT,
    notes TEXT,
    collected_by_id INTEGER,
    collected_by_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consent_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consent_record_id INTEGER,
    action TEXT,
    old_status TEXT,
    new_status TEXT,
    reason TEXT,
    performed_by_id INTEGER,
    performed_by_name TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. INTEGRAÇÕES E WEBHOOKS
CREATE TABLE IF NOT EXISTS integrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT, -- sap_b1, beta_erp
    category TEXT,
    status TEXT,
    environment TEXT,
    config TEXT, -- JSON
    credentials TEXT, -- JSON
    last_sync_at DATETIME,
    stats_today INTEGER DEFAULT 0,
    stats_month INTEGER DEFAULT 0,
    stats_errors INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    url TEXT,
    events TEXT, -- JSON array
    secret TEXT,
    status TEXT DEFAULT 'active',
    stats_sent INTEGER DEFAULT 0,
    stats_failed INTEGER DEFAULT 0,
    avg_latency INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint_id INTEGER,
    event_type TEXT,
    status TEXT, -- success, failed
    status_code INTEGER,
    latency INTEGER,
    request_payload TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. CONFIGURAÇÕES GERAIS
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT,
    setting_group TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_config (
    config_key TEXT PRIMARY KEY,
    config_value TEXT,
    config_type TEXT,
    label TEXT,
    category TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DADOS INICIAIS (SEED)
INSERT OR IGNORE INTO roles (id, name, description, color, is_system) VALUES 
(1, 'Administrador', 'Acesso total ao sistema', 'blue', 1),
(2, 'Supervisor', 'Gestão de equipe e aprovações', 'purple', 1),
(3, 'Operador', 'Operação de cobrança e atendimento', 'green', 1),
(4, 'Convidado', 'Acesso limitado de visualização', 'gray', 1);

-- Inserir alguns tipos de consentimento padrão
INSERT OR IGNORE INTO consent_types (name, code, legal_basis, is_required) VALUES
('Contato via WhatsApp', 'whatsapp_contact', 'legitimate_interest', 1),
('Contato via Email', 'email_contact', 'legitimate_interest', 1),
('Contato Telefônico', 'phone_contact', 'legitimate_interest', 1),
('Gravação de Chamadas', 'call_recording', 'consent', 0);