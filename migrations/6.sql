
CREATE TABLE integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  config TEXT,
  credentials TEXT,
  status TEXT DEFAULT 'inactive',
  last_sync_at DATETIME,
  sync_interval INTEGER DEFAULT 60,
  stats_today INTEGER DEFAULT 0,
  stats_month INTEGER DEFAULT 0,
  stats_errors INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 100,
  environment TEXT DEFAULT 'sandbox',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhook_endpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT NOT NULL,
  secret TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  stats_sent INTEGER DEFAULT 0,
  stats_failed INTEGER DEFAULT 0,
  avg_latency INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  status_code INTEGER,
  latency INTEGER,
  request_payload TEXT,
  response_body TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_logs_endpoint ON webhook_logs(endpoint_id);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_integrations_category ON integrations(category);
CREATE INDEX idx_integrations_status ON integrations(status);
