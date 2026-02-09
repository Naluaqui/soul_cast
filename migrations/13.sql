
-- Insert SAP Business One integration template
INSERT INTO integrations (name, type, category, config, credentials, status, sync_interval, environment)
VALUES (
  'SAP Business One',
  'sap_b1',
  'erp',
  '{"base_url":"","company_db":"","service_layer_port":"50000","sync_customers":true,"sync_invoices":true,"sync_payments":true,"sync_direction":"bidirectional"}',
  '{"username":"","password":"","ssl_enabled":true}',
  'inactive',
  30,
  'sandbox'
);

-- Insert ERP Beta integration template
INSERT INTO integrations (name, type, category, config, credentials, status, sync_interval, environment)
VALUES (
  'ERP Beta - Prospera',
  'beta_erp',
  'erp',
  '{"base_url":"","api_version":"v1","sync_cases":true,"sync_customers":true,"sync_payments":true,"webhook_enabled":true,"webhook_url":""}',
  '{"api_key":"","api_secret":""}',
  'inactive',
  15,
  'sandbox'
);
