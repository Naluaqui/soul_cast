
-- Consent types configuration
CREATE TABLE consent_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  legal_basis TEXT NOT NULL,
  is_required BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  retention_days INTEGER DEFAULT 1825,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual consent records
CREATE TABLE consent_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER,
  customer_document TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  consent_type_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  granted_at DATETIME,
  revoked_at DATETIME,
  expires_at DATETIME,
  collection_method TEXT,
  collection_channel TEXT,
  ip_address TEXT,
  user_agent TEXT,
  proof_url TEXT,
  notes TEXT,
  collected_by_id INTEGER,
  collected_by_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consent_records_case ON consent_records(case_id);
CREATE INDEX idx_consent_records_document ON consent_records(customer_document);
CREATE INDEX idx_consent_records_status ON consent_records(status);

-- Consent history for audit trail
CREATE TABLE consent_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consent_record_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  performed_by_id INTEGER,
  performed_by_name TEXT,
  ip_address TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consent_history_record ON consent_history(consent_record_id);

-- Seed default consent types (LGPD bases legais)
INSERT INTO consent_types (code, name, description, legal_basis, is_required) VALUES
('communication_whatsapp', 'Comunicação via WhatsApp', 'Autorização para envio de mensagens via WhatsApp sobre cobrança', 'Consentimento (Art. 7º, I)', 1),
('communication_sms', 'Comunicação via SMS', 'Autorização para envio de SMS sobre cobrança', 'Consentimento (Art. 7º, I)', 0),
('communication_email', 'Comunicação via E-mail', 'Autorização para envio de e-mails sobre cobrança', 'Consentimento (Art. 7º, I)', 0),
('communication_phone', 'Comunicação via Telefone', 'Autorização para ligações telefônicas sobre cobrança', 'Consentimento (Art. 7º, I)', 1),
('data_processing', 'Tratamento de Dados', 'Autorização para tratamento de dados pessoais para cobrança', 'Execução de contrato (Art. 7º, V)', 1),
('data_sharing', 'Compartilhamento de Dados', 'Autorização para compartilhamento com parceiros de cobrança', 'Consentimento (Art. 7º, I)', 0),
('marketing', 'Comunicações de Marketing', 'Autorização para envio de ofertas e promoções', 'Consentimento (Art. 7º, I)', 0);

-- Seed some sample consent records
INSERT INTO consent_records (case_id, customer_document, customer_name, consent_type_id, status, granted_at, collection_method, collection_channel) VALUES
(1, '123.456.789-00', 'Maria Silva', 1, 'granted', datetime('now', '-30 days'), 'explicit', 'whatsapp'),
(1, '123.456.789-00', 'Maria Silva', 4, 'granted', datetime('now', '-30 days'), 'explicit', 'phone'),
(1, '123.456.789-00', 'Maria Silva', 5, 'granted', datetime('now', '-30 days'), 'contract', 'system'),
(2, '987.654.321-00', 'João Santos', 1, 'pending', NULL, NULL, NULL),
(2, '987.654.321-00', 'João Santos', 4, 'revoked', datetime('now', '-60 days'), 'explicit', 'phone'),
(3, '456.789.123-00', 'Ana Costa', 1, 'granted', datetime('now', '-15 days'), 'explicit', 'whatsapp'),
(3, '456.789.123-00', 'Ana Costa', 4, 'granted', datetime('now', '-15 days'), 'explicit', 'whatsapp');
