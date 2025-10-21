@echo off
REM Migration script for Windows
REM Run this script to apply user preferences migration

echo ========================================
echo  User Preferences Migration
echo ========================================
echo.

REM Check if PostgreSQL is accessible
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL or add it to your PATH
    pause
    exit /b 1
)

echo PostgreSQL found!
echo.

REM Prompt for database credentials
set /p DB_NAME="Enter database name (default: chatbot_db): "
if "%DB_NAME%"=="" set DB_NAME=chatbot_db

set /p DB_USER="Enter PostgreSQL username (default: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

echo.
echo Applying migration to database: %DB_NAME%
echo Using username: %DB_USER%
echo.

REM Apply migration
psql -U %DB_USER% -d %DB_NAME% -f src\db\migrations\20251020_add_user_preferences.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  Migration completed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Restart your backend server
    echo 2. Test settings at /settings page
    echo 3. Send a message to verify AI uses preferences
    echo.
) else (
    echo.
    echo ========================================
    echo  Migration failed!
    echo ========================================
    echo.
    echo Possible reasons:
    echo - Incorrect database credentials
    echo - Database does not exist
    echo - Columns already exist (migration was already applied)
    echo.
    echo To check if columns exist, run:
    echo psql -U %DB_USER% -d %DB_NAME% -c "\d users"
    echo.
)

pause
