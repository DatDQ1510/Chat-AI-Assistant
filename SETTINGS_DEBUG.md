# Settings API Debug Guide

## ❌ Error: "Failed to load settings"

### 🔍 Possible Causes

1. **Database columns not created** - Migration not applied
2. **JWT token expired/invalid** - Need to re-login
3. **Backend not running** - Server crashed
4. **CORS issue** - Frontend can't reach backend
5. **Route not registered** - Server.ts missing user routes

---

## 🛠️ Step-by-Step Fix

### Step 1: Check Database Columns

Open your PostgreSQL client and run:

```bash
cd Backend
psql -U postgres -d chatbot_db -f src/db/migrations/check-and-add-preferences.sql
```

**Expected output:**
```
NOTICE:  Column language created
NOTICE:  Column writing_style created
```

**Or if already exists:**
```
NOTICE:  Column language already exists
NOTICE:  Column writing_style already exists
```

### Step 2: Verify Backend Routes

Check `Backend/src/app.ts` has user routes registered:

```typescript
import userRoutes from "./routes/user.routes.js";

// Should have this line:
app.use("/api/user", userRoutes);
```

### Step 3: Restart Backend Server

```bash
cd Backend
# Kill existing process
taskkill /F /IM node.exe

# Start fresh
npm run dev
```

Watch for these logs:
```
✅ Socket.IO server created
✅ Connected to PostgreSQL
🚀 Server listening on port 5000
```

### Step 4: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Navigate to `/settings`
4. Look for errors:

**Common errors:**

#### A) 401 Unauthorized
```
Failed to load settings: Unauthorized
```
**Fix**: Token expired, need to logout and login again

#### B) 404 Not Found
```
GET http://localhost:5000/api/user/settings 404
```
**Fix**: Routes not registered in app.ts

#### C) 500 Internal Server Error
```
Failed to load settings: Failed to fetch settings
```
**Fix**: Check backend logs, likely database issue

#### D) Network Error
```
Network Error
```
**Fix**: Backend not running or CORS issue

### Step 5: Test API Manually

#### Get JWT Token:
1. Login to app
2. Open DevTools → Application → Local Storage
3. Copy `access_token` value

#### Test with curl:

**Windows (CMD):**
```bash
cd Backend
test-settings-api.bat
# Paste your JWT token when prompted
```

**Manual curl test:**
```bash
curl -X GET http://localhost:5000/api/user/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected response:**
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "language": "en",
  "writing_style": "friendly"
}
```

### Step 6: Check Backend Logs

When you access `/settings` page, backend should show:

```
📝 Fetching user settings...
👤 User ID: abc-123-def
✅ Settings fetched successfully: { id: ..., language: 'en', ... }
```

**If you see:**
```
⚠️ No user ID in request
```
→ JWT token not being sent or invalid

**If you see:**
```
⚠️ User not found: abc-123
```
→ User ID in token doesn't exist in database

**If you see:**
```
❌ Error fetching user settings: ...
```
→ Database query failed, check error details

---

## 🧪 Quick Tests

### Test 1: Database Connection
```sql
psql -U postgres -d chatbot_db -c "SELECT id, email, language, writing_style FROM users LIMIT 1;"
```

Should show user with language and writing_style columns.

### Test 2: Routes Registration
```bash
curl http://localhost:5000/api/user/settings
```

Should return `401 Unauthorized` (not 404 Not Found)

### Test 3: Authentication
```bash
# Get token from login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"password123\"}"

# Use token to access settings
curl -X GET http://localhost:5000/api/user/settings \
  -H "Authorization: Bearer <token_from_above>"
```

---

## 🎯 Common Solutions

### Solution A: Fresh Database Migration
```bash
cd Backend
psql -U postgres -d chatbot_db

# Drop and recreate columns (if corrupted)
ALTER TABLE users DROP COLUMN IF EXISTS language;
ALTER TABLE users DROP COLUMN IF EXISTS writing_style;
ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN writing_style VARCHAR(50) DEFAULT 'friendly';
\q
```

### Solution B: Clear Frontend Cache
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Then login again.

### Solution C: Update All Users (if needed)
```sql
-- Set defaults for all existing users
UPDATE users 
SET language = 'en', writing_style = 'friendly'
WHERE language IS NULL OR writing_style IS NULL;
```

### Solution D: Verify Middleware Chain
Check `Backend/src/routes/user.routes.ts`:

```typescript
router.get("/settings", authenticate, getUserSettings);
router.patch("/settings", authenticate, updateUserSettings);
```

Both routes **MUST** have `authenticate` middleware.

---

## 📊 Success Checklist

- [ ] Database columns exist (language, writing_style)
- [ ] Backend running without errors
- [ ] Routes registered in app.ts
- [ ] User logged in with valid token
- [ ] Browser console shows no 401/404 errors
- [ ] Backend logs show "✅ Settings fetched successfully"
- [ ] Settings page displays form (not loading spinner)

---

## 🆘 Still Not Working?

1. **Check Backend Terminal** for error logs
2. **Check Browser Console** for network errors
3. **Check Network Tab** in DevTools:
   - Request URL correct?
   - Authorization header present?
   - Response status code?
   - Response body content?

4. **Provide this info for debugging:**
   ```
   - Backend error logs (copy full error)
   - Browser console errors (screenshot)
   - Network tab screenshot (request/response)
   - Result of: SELECT * FROM information_schema.columns WHERE table_name='users';
   ```

---

## 📝 Quick Fix Script

Create `fix-settings.bat` in Backend folder:

```batch
@echo off
echo Fixing Settings Feature...

echo Step 1: Applying migration...
psql -U postgres -d chatbot_db -f src/db/migrations/check-and-add-preferences.sql

echo Step 2: Updating existing users...
psql -U postgres -d chatbot_db -c "UPDATE users SET language = 'en', writing_style = 'friendly' WHERE language IS NULL;"

echo Step 3: Verifying...
psql -U postgres -d chatbot_db -c "SELECT email, language, writing_style FROM users LIMIT 3;"

echo Done! Restart backend server now.
pause
```

Run it: `cd Backend && fix-settings.bat`
