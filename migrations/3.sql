
CREATE TABLE journeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  trigger_conditions TEXT,
  cases_active INTEGER DEFAULT 0,
  conversion_rate REAL DEFAULT 0,
  created_by_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journey_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id INTEGER NOT NULL,
  step_order INTEGER NOT NULL,
  day_offset INTEGER NOT NULL DEFAULT 0,
  channel TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_title TEXT NOT NULL,
  template_content TEXT,
  conditions TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journey_steps_journey ON journey_steps(journey_id);

INSERT INTO journeys (name, description, status, cases_active, conversion_rate) VALUES
  ('Régua Padrão - Primeiro Atraso', 'Para clientes em primeira inadimplência, até D+30', 'active', 234, 42.0),
  ('Régua Reincidente', 'Para clientes com histórico de atraso', 'active', 89, 28.0),
  ('Régua Alto Valor', 'Dívidas acima de R$ 10.000', 'paused', 0, 35.0);

INSERT INTO journey_steps (journey_id, step_order, day_offset, channel, action_type, action_title) VALUES
  (1, 1, 1, 'whatsapp', 'message', 'Lembrete amigável'),
  (1, 2, 3, 'whatsapp', 'message', 'Segunda mensagem'),
  (1, 3, 7, 'email', 'message', 'Email formal'),
  (1, 4, 15, 'phone', 'call', 'Ligação operador'),
  (1, 5, 30, 'whatsapp', 'message', 'Proposta especial'),
  (2, 1, 1, 'phone', 'call', 'Ligação imediata'),
  (2, 2, 3, 'whatsapp', 'message', 'Proposta de acordo'),
  (2, 3, 7, 'email', 'message', 'Notificação formal'),
  (2, 4, 15, 'phone', 'call', 'Segunda ligação'),
  (3, 1, 1, 'phone', 'call', 'Ligação gerente'),
  (3, 2, 2, 'whatsapp', 'message', 'Proposta personalizada'),
  (3, 3, 5, 'email', 'message', 'Documentação');
