
-- Seed initial integrations data
INSERT INTO integrations (name, type, category, config, credentials, status, sync_interval, environment, stats_today, stats_month, success_rate, last_sync_at) VALUES
('PIX Cobrança Principal', 'pix', 'bank', '{"bank":"Banco do Brasil","account":"12345-6"}', '{"client_id":"bb_client_***8a7f"}', 'active', 30, 'production', 127, 3421, 98.5, datetime('now', '-2 minutes')),
('PIX Itaú Backup', 'pix', 'bank', '{"bank":"Itaú","account":"98765-4"}', '{"client_id":"itau_***4b2c"}', 'active', 30, 'production', 45, 1203, 99.1, datetime('now', '-5 minutes')),
('Boleto Registrado', 'boleto', 'bank', '{"bank":"Bradesco","carteira":"09"}', '{"client_id":"brad_***9e1d"}', 'active', 60, 'production', 89, 2156, 97.8, datetime('now', '-10 minutes')),
('TED Pagamentos', 'ted', 'bank', '{"bank":"Santander"}', '{"client_id":"san_***3f5a"}', 'error', 60, 'sandbox', 0, 45, 85.2, datetime('now', '-60 minutes')),
('SAP Business One', 'SAP', 'erp', '{"base_url":"https://sap.empresa.com/api","version":"10.0"}', '{"api_key":"***"}', 'active', 30, 'production', 152, 4521, 99.5, datetime('now', '-15 minutes')),
('TOTVS Protheus', 'TOTVS', 'erp', '{"base_url":"https://totvs.empresa.com/rest"}', '{"token":"***"}', 'error', 60, 'production', 0, 2341, 93.3, datetime('now', '-60 minutes')),
('API Legado', 'REST', 'erp', '{"base_url":"https://legado.empresa.com/v1"}', '{}', 'inactive', 120, 'production', 0, 890, 100, datetime('now', '-1 day'));

-- Seed webhook endpoints
INSERT INTO webhook_endpoints (name, url, events, secret, status, stats_sent, stats_failed, avg_latency) VALUES
('Sistema Principal', 'https://app.empresa.com/webhooks/soulcollect', '["payment.confirmed","payment.failed","case.updated"]', 'whsec_8f7a6b5c4d3e2f1a9b8c7d6e5f4a3b2c', 'active', 12453, 23, 145),
('CRM Integration', 'https://crm.empresa.com/api/hooks', '["case.created","case.resolved","customer.contacted"]', 'whsec_f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8', 'active', 5621, 8, 230),
('Analytics', 'https://analytics.empresa.com/ingest', '["*"]', 'whsec_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d', 'paused', 890, 156, 890);

-- Seed some webhook logs
INSERT INTO webhook_logs (endpoint_id, event_type, status, status_code, latency, request_payload, created_at) VALUES
(1, 'payment.confirmed', 'success', 200, 123, '{"payment_id":1234,"amount":1500.00}', datetime('now', '-2 minutes')),
(2, 'case.updated', 'success', 200, 245, '{"case_id":456,"status":"negotiating"}', datetime('now', '-5 minutes')),
(1, 'payment.failed', 'success', 200, 98, '{"payment_id":1235,"error":"expired"}', datetime('now', '-8 minutes')),
(2, 'customer.contacted', 'failed', 500, 2100, '{"case_id":457,"channel":"whatsapp"}', datetime('now', '-15 minutes')),
(3, 'case.created', 'retrying', 503, 30000, '{"case_id":458}', datetime('now', '-30 minutes')),
(1, 'payment.confirmed', 'success', 200, 156, '{"payment_id":1236,"amount":2300.00}', datetime('now', '-45 minutes')),
(2, 'case.resolved', 'success', 201, 312, '{"case_id":455,"resolution":"paid"}', datetime('now', '-60 minutes')),
(1, 'case.updated', 'success', 200, 134, '{"case_id":454}', datetime('now', '-75 minutes')),
(2, 'payment.confirmed', 'success', 200, 198, '{"payment_id":1237}', datetime('now', '-90 minutes')),
(1, 'customer.contacted', 'failed', 502, 5000, '{"case_id":453}', datetime('now', '-2 hours'));
