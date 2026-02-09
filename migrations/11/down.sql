DROP INDEX idx_invite_tokens_email;
DROP INDEX idx_invite_tokens_token;
DROP TABLE invite_tokens;
ALTER TABLE app_users DROP COLUMN is_owner;