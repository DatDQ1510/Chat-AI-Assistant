-- Add custom instructions and roleplay mode to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS custom_instructions TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS roleplay_mode VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN users.custom_instructions IS 'User custom AI behavior instructions (e.g. "Always explain in simple terms")';
COMMENT ON COLUMN users.roleplay_mode IS 'AI roleplay persona (mentor, tutor, friend, professional, etc.)';
