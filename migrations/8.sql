
-- Risk alerts table for supervisor monitoring
CREATE TABLE risk_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  risk_score INTEGER DEFAULT 50,
  is_acknowledged BOOLEAN DEFAULT 0,
  acknowledged_by_id INTEGER,
  acknowledged_at DATETIME,
  is_resolved BOOLEAN DEFAULT 0,
  resolved_by_id INTEGER,
  resolved_at DATETIME,
  resolution_notes TEXT,
  auto_generated BOOLEAN DEFAULT 1,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_alerts_case ON risk_alerts(case_id);
CREATE INDEX idx_risk_alerts_severity ON risk_alerts(severity);
CREATE INDEX idx_risk_alerts_status ON risk_alerts(is_resolved, is_acknowledged);

-- Supervisor actions/interventions table
CREATE TABLE supervisor_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id INTEGER,
  case_id INTEGER,
  action_type TEXT NOT NULL,
  description TEXT,
  supervisor_id INTEGER,
  supervisor_name TEXT,
  assigned_to_id INTEGER,
  assigned_to_name TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  due_at DATETIME,
  completed_at DATETIME,
  result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supervisor_actions_alert ON supervisor_actions(alert_id);
CREATE INDEX idx_supervisor_actions_status ON supervisor_actions(status);

-- Risk rules configuration
CREATE TABLE risk_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  conditions TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT 1,
  alert_template TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default risk rules
INSERT INTO risk_rules (name, description, rule_type, conditions, severity, alert_template) VALUES
('Promessa Não Cumprida', 'Cliente fez promessa de pagamento mas não pagou no prazo', 'broken_promise', '{"days_after_promise": 3}', 'high', 'Cliente {{customer_name}} prometeu pagar em {{promise_date}} mas não cumpriu'),
('Sem Contato Prolongado', 'Caso sem contato há mais de 15 dias', 'no_contact', '{"days_without_contact": 15}', 'medium', 'Caso #{{case_number}} sem contato há {{days}} dias'),
('Alto Valor em Risco', 'Dívida acima de R$ 50.000 com mais de 90 dias de atraso', 'high_value_risk', '{"min_debt": 50000, "min_days_overdue": 90}', 'critical', 'Caso crítico: R$ {{debt}} com {{days}} dias de atraso'),
('Score de Risco Elevado', 'Score de risco do caso acima de 80', 'high_risk_score', '{"min_score": 80}', 'high', 'Caso #{{case_number}} com score de risco {{score}}'),
('Escalação Necessária', 'Caso sem progresso após 3 tentativas de contato', 'escalation_needed', '{"max_attempts": 3}', 'medium', 'Caso #{{case_number}} precisa de escalação - {{attempts}} tentativas sem sucesso'),
('Consentimento Pendente', 'Caso sem consentimento LGPD registrado', 'missing_consent', '{}', 'low', 'Caso #{{case_number}} sem consentimento LGPD');

-- Seed some sample risk alerts
INSERT INTO risk_alerts (case_id, alert_type, severity, title, description, risk_score, metadata, created_at) VALUES
(1, 'broken_promise', 'high', 'Promessa de pagamento não cumprida', 'Cliente Maria Silva prometeu pagar R$ 1.500,00 em 10/01 mas não efetuou o pagamento', 75, '{"promise_date":"2025-01-10","amount":1500}', datetime('now', '-2 hours')),
(2, 'high_value_risk', 'critical', 'Alto valor em risco', 'Dívida de R$ 85.000,00 com 120 dias de atraso precisa de atenção imediata', 95, '{"debt":85000,"days_overdue":120}', datetime('now', '-30 minutes')),
(3, 'no_contact', 'medium', 'Sem contato há 18 dias', 'Última tentativa de contato foi em 27/12/2024 sem resposta', 60, '{"last_contact":"2024-12-27","days":18}', datetime('now', '-1 hour')),
(4, 'escalation_needed', 'medium', 'Escalação recomendada', '4 tentativas de contato sem sucesso, considerar abordagem diferente', 65, '{"attempts":4}', datetime('now', '-4 hours')),
(1, 'missing_consent', 'low', 'Consentimento LGPD pendente', 'Cliente ainda não forneceu consentimento para comunicações', 40, '{}', datetime('now', '-6 hours'));
