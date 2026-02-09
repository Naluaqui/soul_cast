
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_group TEXT NOT NULL DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO app_settings (setting_key, setting_value, setting_group) VALUES
  ('company_name', 'Soul Collect Cobrança', 'general'),
  ('cnpj', '12.345.678/0001-90', 'general'),
  ('language', 'pt-BR', 'general'),
  ('timezone', 'America/Sao_Paulo', 'general'),
  ('logo_url', '', 'general'),
  ('email_notifications', 'true', 'notifications'),
  ('push_notifications', 'true', 'notifications'),
  ('case_alerts', 'true', 'notifications'),
  ('security_alerts', 'true', 'notifications'),
  ('session_timeout', '30', 'security'),
  ('login_attempts', '5', 'security'),
  ('require_2fa', 'false', 'security'),
  ('audit_logging', 'true', 'security'),
  ('operation_start', '08:00', 'schedule'),
  ('operation_end', '20:00', 'schedule'),
  ('operation_days', 'mon,tue,wed,thu,fri', 'schedule'),
  ('theme', 'light', 'appearance'),
  ('primary_color', '#3B82F6', 'appearance'),
  ('compact_mode', 'false', 'appearance');
