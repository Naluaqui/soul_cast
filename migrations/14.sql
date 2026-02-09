
CREATE TABLE dashboard_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT,
  config_type TEXT DEFAULT 'number',
  label TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configurações padrão
INSERT INTO dashboard_config (config_key, config_value, config_type, label, description, category) VALUES
  ('monthly_goal', '320000', 'currency', 'Meta Mensal', 'Meta de recuperação para o mês atual', 'goals'),
  ('annual_goal', '3840000', 'currency', 'Meta Anual', 'Meta de recuperação para o ano', 'goals'),
  ('sla_target', '95', 'percentage', 'Meta de SLA', 'Meta de SLA de atendimento (%)', 'goals'),
  ('contact_rate_target', '70', 'percentage', 'Meta Taxa de Contato', 'Meta de taxa de contato (%)', 'goals'),
  ('conversion_rate_target', '45', 'percentage', 'Meta Taxa de Conversão', 'Meta de taxa de conversão (%)', 'goals'),
  ('manual_portfolio_value', NULL, 'currency', 'Valor Carteira (Manual)', 'Valor da carteira inserido manualmente (sobrescreve cálculo automático se preenchido)', 'manual'),
  ('manual_default_value', NULL, 'currency', 'Valor Inadimplência (Manual)', 'Valor em inadimplência inserido manualmente', 'manual'),
  ('manual_recovered_value', NULL, 'currency', 'Valor Recuperado (Manual)', 'Valor recuperado inserido manualmente', 'manual'),
  ('use_manual_data', '0', 'boolean', 'Usar Dados Manuais', 'Se ativado, usa os valores manuais ao invés dos calculados pelo sistema', 'settings'),
  ('data_source', 'system', 'select', 'Fonte dos Dados', 'Define a fonte principal dos dados: system, manual, integration', 'settings');
