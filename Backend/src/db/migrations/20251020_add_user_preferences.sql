-- Migration: Add language and writing_style preferences to users table
-- Created: 2025-10-20

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS writing_style VARCHAR(50) DEFAULT 'friendly';

-- Add comments for documentation
COMMENT ON COLUMN users.language IS 'User preferred response language (vi, en, ja, etc.)';
COMMENT ON COLUMN users.writing_style IS 'AI writing style preference (formal, casual, technical, friendly)';
