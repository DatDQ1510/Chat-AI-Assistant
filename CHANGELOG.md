# 📝 Changelog - AI Chatbot Assistant

## [2025-10-20] - Major Updates

### ✨ Features Added

#### 1. **Custom Instructions & Roleplay Modes**
- ✅ Users can define custom AI behavior instructions
- ✅ 6 roleplay modes: Mentor, Tutor, Friend, Professional, Coach, Expert
- ✅ Custom instructions textarea (500 chars limit)
- ✅ Integrated into AI system prompt via context service

**Database Schema:**
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS custom_instructions TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS roleplay_mode VARCHAR(50) DEFAULT NULL;
```

**API Endpoints:**
- `GET /api/user/settings` - Returns custom_instructions, roleplay_mode
- `PATCH /api/user/settings` - Updates custom_instructions, roleplay_mode

**Frontend UI:**
- Settings page with textarea for custom instructions
- Dropdown selector for roleplay mode
- Auto-save with success feedback

---

#### 2. **AI Streaming & Token Limits** 🔧

**Fixed Issues:**
- ❌ "AI is typing..." không hiển thị
- ❌ Streaming chunks không hiện ra
- ❌ Không có giới hạn token

**Solutions:**
- ✅ Fixed AI message placeholder creation (proper object instead of empty string)
- ✅ Proper event flow: save → broadcast → stream → update
- ✅ Token limits: 4000 (normal), 5000 (with suggestions)
- ✅ Added timeout handling (60s)
- ✅ Socket disconnect/reconnect handling

**Token Configuration:**
```typescript
// Normal messages
max_tokens: 4000

// Messages with suggestions
max_tokens: 5000
```

---

#### 3. **Suggestion Mode Refactor**
- ✅ Changed from prop to internal state management
- ✅ Toggle button with visual feedback
- ✅ Auto-reset after sending message
- ✅ Orange border + yellow background when active

**Before:**
```typescript
// Parent managed state
const [suggestMode, setSuggestMode] = useState(false);
<ChatInput suggestMode={suggestMode} onToggleSuggest={setSuggestMode} />
```

**After:**
```typescript
// Self-managed state
<ChatInput onSendMessage={handleSend} />
// Component handles state internally
```

---

### 🔧 Technical Changes

#### Backend Changes:

1. **context.service.ts**
   - Added `ROLEPLAY_MAP` with 6 persona instructions
   - Load `custom_instructions` and `roleplay_mode` from user table
   - Inject into system prompt before language/style preferences
   - Support for custom AI behavior rules

2. **chat.socket.ts**
   - Fixed AI message creation flow
   - Create message in database before emitting `ai_message_init`
   - Proper message object format in events
   - Dynamic token limit based on `needs_suggestions` flag
   - Added `updateMessageContent` call after streaming

3. **generator.service.ts**
   - Added `maxTokens` parameter (default: 4000)
   - Pass to OpenAI API: `max_tokens: maxTokens`
   - Added `temperature: 0.7` for better responses

4. **user.controller.ts**
   - Updated `getUserSettings` to return new fields
   - Updated `updateUserSettings` to accept new fields
   - Enhanced logging with payload details

5. **user.model.ts**
   - Added `custom_instructions?: string` (TEXT)
   - Added `roleplay_mode?: string` (VARCHAR(50))

#### Frontend Changes:

1. **ChatInput.tsx**
   - Moved `suggestMode` from prop to state
   - Self-managed toggle with `useState`
   - Auto-reset after send
   - Removed dependency on parent state

2. **ChatContainer.tsx**
   - Removed `suggestMode` state management
   - Event handlers already handle streaming correctly
   - Added timeout handling for AI responses (60s)
   - Socket disconnect error handling
   - Retry mechanism for failed AI messages

3. **SettingsPage.tsx**
   - Added `TextArea` for custom instructions
   - Added `Select` for roleplay mode with 6 options
   - Updated form to handle new fields
   - Visual indicators for each roleplay persona

4. **user.service.ts**
   - Extended `UserSettings` interface with new fields
   - Extended `UpdateSettingsDto` interface

5. **chat.ts (types)**
   - Simplified `ChatInputProps` (removed suggest props)

---

### 📊 Event Flow (WebSocket)

```mermaid
User sends message
    ↓
Backend saves user message to DB
    ↓
Emit "receive_message" (user message)
    ↓
Backend creates AI message placeholder in DB
    ↓
Emit "ai_message_init" (AI message object)
    ↓
Frontend shows "AI is typing..." + spinner
    ↓
Backend streams AI response chunks
    ↓
Emit "ai_stream" (each chunk)
    ↓
Frontend appends chunks to message content
    ↓
Backend finishes streaming
    ↓
Update AI message in DB with full content
    ↓
Emit "ai_stream_end" (full content)
    ↓
Frontend marks message as complete
```

---

### 🧪 Testing Checklist

- [x] Send normal message → See "AI is typing..."
- [x] See streaming chunks appear character by character
- [x] Enable suggest mode → Send message → Verify 5000 token limit
- [x] Disable suggest mode → Verify 4000 token limit
- [x] Set custom instructions in settings
- [x] Choose roleplay mode
- [x] Verify AI follows custom instructions
- [x] Test socket disconnect during AI response
- [x] Test AI response timeout (60s)
- [x] Test retry button for failed messages

---

### 📝 Database Migrations

**Location:** `Backend/src/db/migrations/`

1. `20251020_add_user_preferences.sql` - Language, writing_style
2. `20251020_add_custom_instructions.sql` - Custom instructions, roleplay mode
3. `check-and-add-preferences.sql` - Validation script

**To apply migrations:**
```bash
cd Backend
psql -U postgres -d ai_chatbot -f src/db/migrations/20251020_add_custom_instructions.sql
```

---

### 🚀 Deployment Notes

1. **Environment Variables:**
   - Ensure `OPENAI_API_KEY` is set
   - Check database connection

2. **Database Migration:**
   - Run custom instructions migration
   - Verify columns added successfully

3. **Frontend Build:**
   ```bash
   cd Frontend
   npm run build
   ```

4. **Backend Restart:**
   ```bash
   cd Backend
   npm run build
   npm start
   ```

5. **Verify:**
   - Test streaming in browser console
   - Check token limits in backend logs
   - Test custom instructions save/load

---

### 📚 Documentation

- `docs/STREAMING_FIX.md` - Detailed streaming fix explanation
- `docs/SETTINGS_IMPLEMENTATION.md` - Settings feature guide
- `docs/PAGINATION_GUIDE.md` - Message pagination guide

---

### 🐛 Known Issues

None currently

---

### 🔮 Future Enhancements

- [ ] Add more roleplay modes
- [ ] Allow custom roleplay definitions
- [ ] Add instruction templates
- [ ] Token usage analytics
- [ ] Per-conversation custom instructions
- [ ] Export/import custom instructions

