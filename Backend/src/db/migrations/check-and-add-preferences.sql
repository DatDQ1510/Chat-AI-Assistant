-- Check if user preferences columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('language', 'writing_style');

-- If not exists, create them
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'language'
    ) THEN
        ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en';
        RAISE NOTICE 'Column language created';
    ELSE
        RAISE NOTICE 'Column language already exists';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'writing_style'
    ) THEN
        ALTER TABLE users ADD COLUMN writing_style VARCHAR(50) DEFAULT 'friendly';
        RAISE NOTICE 'Column writing_style created';
    ELSE
        RAISE NOTICE 'Column writing_style already exists';
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
