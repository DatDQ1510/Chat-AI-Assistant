-- Migration: Add important column to messages table
-- Date: October 21, 2025
-- Purpose: Allow users to mark messages as important for semantic search filtering

-- Add important column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS important BOOLEAN DEFAULT FALSE;

-- Create index for faster filtering on important messages
CREATE INDEX IF NOT EXISTS idx_messages_important 
ON messages(important) 
WHERE important = TRUE;

-- Add comment
COMMENT ON COLUMN messages.important IS 'Flag to mark message as important for semantic search';
