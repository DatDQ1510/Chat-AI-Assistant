# 🗄️ Database Migration Guide

## Overview
This guide explains how to apply database migrations for the AI Chatbot Assistant project.

---

## Prerequisites

- PostgreSQL installed and running
- Database `ai_chatbot` created
- User credentials configured in `.env`

---

## Available Migrations

### 1. User Preferences Migration
**File:** `20251020_add_user_preferences.sql`

Adds columns for language and writing style preferences:
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS writing_style VARCHAR(50) DEFAULT 'friendly';
```

### 2. Custom Instructions Migration
**File:** `20251020_add_custom_instructions.sql`

Adds columns for custom AI behavior instructions:
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS custom_instructions TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS roleplay_mode VARCHAR(50) DEFAULT NULL;
```

---

## Apply Migrations

### Method 1: Using psql command line

```bash
# Navigate to Backend directory
cd Backend

# Apply user preferences migration
psql -U postgres -d ai_chatbot -f src/db/migrations/20251020_add_user_preferences.sql

# Apply custom instructions migration
psql -U postgres -d ai_chatbot -f src/db/migrations/20251020_add_custom_instructions.sql
```

### Method 2: Using PostgreSQL client (pgAdmin, DBeaver, etc.)

1. Connect to your database
2. Open the SQL file
3. Execute the SQL script

### Method 3: Using Node.js script

```bash
cd Backend
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const sql = fs.readFileSync('src/db/migrations/20251020_add_custom_instructions.sql', 'utf8');
  await pool.query(sql);
  console.log('✅ Migration applied successfully');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
"
```

---

## Verify Migrations

### Check columns exist

```sql
SELECT column_name, data_type, character_maximum_length, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('language', 'writing_style', 'custom_instructions', 'roleplay_mode');
```

Expected output:
```
column_name         | data_type         | character_maximum_length | column_default
--------------------|-------------------|-------------------------|---------------
language            | character varying | 10                      | 'en'::character varying
writing_style       | character varying | 50                      | 'friendly'::character varying
custom_instructions | text              | NULL                    | NULL
roleplay_mode       | character varying | 50                      | NULL
```

### Check existing users

```sql
SELECT id, email, language, writing_style, 
       CASE WHEN custom_instructions IS NULL THEN 'NULL' ELSE 'SET' END as custom_instr,
       roleplay_mode
FROM users
LIMIT 5;
```

---

## Rollback (if needed)

### Remove custom instructions columns

```sql
ALTER TABLE users 
DROP COLUMN IF EXISTS custom_instructions,
DROP COLUMN IF EXISTS roleplay_mode;
```

### Remove user preferences columns

```sql
ALTER TABLE users 
DROP COLUMN IF EXISTS language,
DROP COLUMN IF EXISTS writing_style;
```

---

## Test Data

### Insert test user with preferences

```sql
INSERT INTO users (email, password, firstname, lastname, language, writing_style, custom_instructions, roleplay_mode)
VALUES (
  'test@example.com',
  'hashed_password',
  'Test',
  'User',
  'vi',
  'friendly',
  'Always explain in simple terms and use analogies',
  'mentor'
);
```

### Update existing user

```sql
UPDATE users
SET 
  language = 'en',
  writing_style = 'technical',
  custom_instructions = 'Act as a coding mentor and always include practical examples',
  roleplay_mode = 'tutor'
WHERE email = 'your-email@example.com';
```

---

## Troubleshooting

### Error: relation "users" does not exist

**Solution:** Run the main schema migration first to create the users table.

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'users'
);
```

### Error: column already exists

**Solution:** The migration uses `IF NOT EXISTS`, so this shouldn't happen. If it does:

```sql
-- Check which columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users';
```

### Error: permission denied

**Solution:** Ensure your database user has ALTER TABLE privileges:

```sql
GRANT ALL PRIVILEGES ON TABLE users TO your_user;
```

---

## Migration Status Tracking

### Create migrations table (optional)

```sql
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Record migrations
INSERT INTO migrations (filename) VALUES 
  ('20251020_add_user_preferences.sql'),
  ('20251020_add_custom_instructions.sql')
ON CONFLICT (filename) DO NOTHING;
```

### Check applied migrations

```sql
SELECT * FROM migrations ORDER BY applied_at DESC;
```

---

## Automated Migration Script

Create `migrate.bat` in Backend directory:

```batch
@echo off
echo 🗄️ Running database migrations...

psql -U postgres -d ai_chatbot -f src/db/migrations/20251020_add_user_preferences.sql
if %errorlevel% neq 0 (
    echo ❌ User preferences migration failed
    exit /b 1
)

psql -U postgres -d ai_chatbot -f src/db/migrations/20251020_add_custom_instructions.sql
if %errorlevel% neq 0 (
    echo ❌ Custom instructions migration failed
    exit /b 1
)

echo ✅ All migrations applied successfully
```

Run with:
```bash
cd Backend
migrate.bat
```

---

## Next Steps

After applying migrations:

1. ✅ Restart backend server
2. ✅ Test settings API endpoints
3. ✅ Verify frontend settings page
4. ✅ Test AI responses with custom instructions
5. ✅ Monitor backend logs for errors

---

## Support

If you encounter issues:

1. Check PostgreSQL logs
2. Verify database connection in `.env`
3. Ensure all dependencies installed
4. Review migration SQL for syntax errors

