
CREATE TABLE cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_document TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  contract_id TEXT,
  contract_type TEXT,
  total_debt REAL NOT NULL DEFAULT 0,
  days_overdue INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  last_contact_channel TEXT,
  last_contact_at DATETIME,
  next_action_at DATETIME,
  assigned_operator_id INTEGER,
  assigned_operator_name TEXT,
  risk_score INTEGER DEFAULT 50,
  has_consent BOOLEAN DEFAULT 0,
  installments_overdue INTEGER DEFAULT 0,
  total_installments INTEGER DEFAULT 1,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_days_overdue ON cases(days_overdue);
CREATE INDEX idx_cases_assigned_operator ON cases(assigned_operator_id);
CREATE INDEX idx_cases_case_number ON cases(case_number);

CREATE TABLE case_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  channel TEXT,
  user_id INTEGER,
  user_name TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_case_timeline_case_id ON case_timeline(case_id);

CREATE TABLE case_installments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount REAL NOT NULL,
  paid_amount REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_case_installments_case_id ON case_installments(case_id);

-- Seed demo cases
INSERT INTO cases (case_number, customer_name, customer_document, customer_phone, customer_email, contract_id, contract_type, total_debt, days_overdue, status, last_contact_channel, last_contact_at, next_action_at, assigned_operator_name, risk_score, has_consent, installments_overdue, total_installments) VALUES
('CASE-001', 'Maria Silva Santos', '***.***.789-00', '+55 11 9****-1234', 'm***@email.com', 'CTR-2024-001', 'Empréstimo Pessoal', 4580.00, 15, 'negotiating', 'whatsapp', '2025-01-06 14:30:00', '2025-01-08 10:00:00', 'Ana Costa', 65, 1, 2, 12),
('CASE-002', 'João Pedro Oliveira', '***.***.456-11', '+55 21 9****-5678', 'j***@email.com', 'CTR-2024-002', 'Cartão de Crédito', 12350.00, 45, 'contacted', 'whatsapp', '2025-01-05 09:15:00', '2025-01-07 14:00:00', 'Carlos Mendes', 82, 1, 3, 6),
('CASE-003', 'Ana Beatriz Ferreira', '***.***.123-22', '+55 31 9****-9012', 'a***@email.com', 'CTR-2024-003', 'Financiamento Veículo', 28900.00, 7, 'new', 'email', NULL, '2025-01-07 08:00:00', 'Ana Costa', 45, 1, 1, 48),
('CASE-004', 'Roberto Carlos Lima', '***.***.987-33', '+55 11 9****-3456', 'r***@email.com', 'CTR-2024-004', 'Empréstimo Consignado', 8750.00, 30, 'promised', 'phone', '2025-01-04 16:45:00', '2025-01-10 10:00:00', 'Mariana Souza', 55, 1, 2, 24),
('CASE-005', 'Fernanda Almeida Costa', '***.***.654-44', '+55 19 9****-7890', 'f***@email.com', 'CTR-2024-005', 'Cartão de Crédito', 3200.00, 3, 'new', 'whatsapp', NULL, '2025-01-07 09:00:00', 'Carlos Mendes', 25, 1, 1, 1),
('CASE-006', 'Paulo Henrique Barbosa', '***.***.321-55', '+55 41 9****-2345', 'p***@email.com', 'CTR-2024-006', 'Empréstimo Pessoal', 15680.00, 60, 'defaulted', 'whatsapp', '2025-01-02 11:20:00', '2025-01-09 14:00:00', 'Mariana Souza', 95, 0, 4, 18),
('CASE-007', 'Luciana Martins', '***.***.852-66', '+55 51 9****-6789', 'l***@email.com', 'CTR-2024-007', 'Financiamento Imóvel', 45000.00, 22, 'negotiating', 'phone', '2025-01-06 10:00:00', '2025-01-08 15:00:00', 'Ana Costa', 70, 1, 2, 360),
('CASE-008', 'Marcos Antônio Reis', '***.***.147-77', '+55 71 9****-0123', 'm***@email.com', 'CTR-2024-008', 'Cartão de Crédito', 6890.00, 12, 'contacted', 'sms', '2025-01-05 13:30:00', '2025-01-07 11:00:00', 'Carlos Mendes', 50, 1, 1, 3),
('CASE-009', 'Camila Rodrigues', '***.***.369-88', '+55 85 9****-4567', 'c***@email.com', 'CTR-2024-009', 'Empréstimo Pessoal', 2100.00, 5, 'paid', 'whatsapp', '2025-01-06 16:00:00', '2025-01-07 10:00:00', 'Mariana Souza', 15, 1, 0, 6),
('CASE-010', 'Ricardo Souza Neto', '***.***.258-99', '+55 27 9****-8901', 'r***@email.com', 'CTR-2024-010', 'Financiamento Veículo', 18500.00, 35, 'paused', 'email', '2025-01-03 09:45:00', '2025-01-15 10:00:00', 'Ana Costa', 60, 1, 2, 36);

-- Seed timeline events for CASE-001
INSERT INTO case_timeline (case_id, event_type, title, description, channel, user_name) VALUES
(1, 'contact', 'WhatsApp Enviado', 'Mensagem automática de cobrança enviada', 'whatsapp', 'Sistema'),
(1, 'contact', 'Cliente Respondeu', 'Cliente solicitou mais informações sobre acordo', 'whatsapp', NULL),
(1, 'action', 'Proposta Enviada', 'Proposta de acordo enviada: 3x de R$ 1.526,67', NULL, 'Ana Costa'),
(1, 'note', 'Anotação', 'Cliente pediu para entrar em contato após as 18h', NULL, 'Ana Costa');

-- Seed installments for CASE-001
INSERT INTO case_installments (case_id, installment_number, due_date, amount, paid_amount, status) VALUES
(1, 1, '2024-11-15', 381.67, 381.67, 'paid'),
(1, 2, '2024-12-15', 381.67, 0, 'overdue'),
(1, 3, '2025-01-15', 381.67, 0, 'overdue'),
(1, 4, '2025-02-15', 381.67, 0, 'pending'),
(1, 5, '2025-03-15', 381.67, 0, 'pending'),
(1, 6, '2025-04-15', 381.67, 0, 'pending');
