
CREATE TABLE whatsapp_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER,
  direction TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL,
  template_name TEXT,
  content TEXT NOT NULL,
  media_url TEXT,
  status TEXT DEFAULT 'pending',
  whatsapp_message_id TEXT,
  error_message TEXT,
  sent_at DATETIME,
  delivered_at DATETIME,
  read_at DATETIME,
  replied_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_whatsapp_messages_case_id ON whatsapp_messages(case_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_whatsapp_id ON whatsapp_messages(whatsapp_message_id);

CREATE TABLE whatsapp_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  language TEXT DEFAULT 'pt_BR',
  content TEXT NOT NULL,
  variables TEXT,
  status TEXT DEFAULT 'approved',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO whatsapp_templates (name, category, content, variables) VALUES
('cobranca_amigavel', 'UTILITY', 'Olá {{1}}! Tudo bem? 😊 Identificamos uma pendência de R$ {{2}} em sua conta. Podemos ajudar a resolver isso hoje?', '["customer_name", "amount"]'),
('cobranca_urgente', 'UTILITY', '{{1}}, sua pendência de R$ {{2}} está em atraso há {{3}} dias. Precisamos regularizar antes que haja negativação. Posso apresentar uma proposta especial?', '["customer_name", "amount", "days_overdue"]'),
('proposta_acordo', 'UTILITY', '{{1}}, temos uma condição especial para você: {{2}}% de desconto para pagamento até {{3}}. Valor final: R$ {{4}}. Posso gerar o boleto agora?', '["customer_name", "discount", "due_date", "final_amount"]'),
('confirmacao_pagamento', 'UTILITY', 'Olá {{1}}! Confirmamos o recebimento do seu pagamento de R$ {{2}}. Obrigado por regularizar sua situação! 🎉', '["customer_name", "amount"]'),
('lembrete_promessa', 'UTILITY', 'Oi {{1}}! Passando para lembrar do pagamento combinado para hoje no valor de R$ {{2}}. Já gerou seu boleto/Pix?', '["customer_name", "amount"]'),
('boas_vindas', 'MARKETING', 'Olá {{1}}! Bem-vindo(a) ao nosso canal de atendimento. Como posso ajudar você hoje?', '["customer_name"]');
