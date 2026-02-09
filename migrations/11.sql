-- Add is_owner flag to app_users (only one owner per app)
ALTER TABLE app_users ADD COLUMN is_owner BOOLEAN DEFAULT 0;

-- Create invite_tokens table for admin invitations
CREATE TABLE invite_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  role_id INTEGER NOT NULL,
  invited_by_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX idx_invite_tokens_email ON invite_tokens(email);