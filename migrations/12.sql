ALTER TABLE invite_tokens ADD COLUMN corporate_email TEXT;
ALTER TABLE invite_tokens ADD COLUMN requires_validation BOOLEAN DEFAULT 0;
ALTER TABLE app_users ADD COLUMN corporate_email TEXT;