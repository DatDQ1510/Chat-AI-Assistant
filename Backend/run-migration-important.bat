@echo off
echo Running database migration: Add important column to messages
echo.

REM Run the migration
psql -U postgres -d ai_chatbot -f src\db\migrations\20251021_add_important_to_messages.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration completed successfully!
) else (
    echo.
    echo ❌ Migration failed! Error code: %ERRORLEVEL%
    echo Please check PostgreSQL connection and database name.
)

pause
