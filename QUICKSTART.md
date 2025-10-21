# 🚀 Quick Start - AI Streaming & Custom Instructions

## 1️⃣ Apply Database Migrations

```bash
cd Backend

# Apply custom instructions migration
psql -U postgres -d ai_chatbot -f src/db/migrations/20251020_add_custom_instructions.sql
```

**Verify columns added:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('custom_instructions', 'roleplay_mode');
```

---

## 2️⃣ Restart Backend

```bash
cd Backend
npm run build
npm start
```

**Look for these logs:**
```
✅ Client connected
🎯 Token limit: 4000 (suggestions: false)
🤖 AI message placeholder created
📊 Streamed X chunks, total Y characters
```

---

## 3️⃣ Test in Browser

### Test AI Streaming:

1. Open browser console (F12)
2. Send a message: "Explain quantum computing"
3. **Watch for:**
   - ✅ "AI is typing..." appears
   - ✅ Spinner shows in message
   - ✅ Text appears character by character
   - ✅ Spinner disappears when done

**Console logs:**
```
🤖 AI init: { id: "...", conversation_id: "...", role: "assistant" }
📨 Received message: ...
✅ AI finished: ...
```

---

### Test Suggestion Mode:

1. Click bulb icon (💡) - should turn orange
2. Status shows: "💡 Suggestions enabled"
3. Send message: "Tell me about React hooks"
4. **Backend should log:**
   ```
   💡 Suggestions requested
   🎯 Token limit: 5000 (suggestions: true)
   ```
5. AI response should include follow-up questions

---

### Test Custom Instructions:

1. Navigate to `/settings`
2. Set custom instructions: "Always explain in simple terms"
3. Choose roleplay mode: "Tutor"
4. Save settings
5. **Backend should log:**
   ```
   🎨 User preferences loaded: {
     language: 'en',
     writingStyle: 'friendly',
     roleplayMode: 'tutor',
     hasCustomInstructions: true
   }
   ```
6. Send message: "What is React?"
7. AI should respond in simple terms with tutor persona

---

## 4️⃣ Verify Token Limits

### Normal message (4000 tokens):

```bash
# In backend logs
🎯 Token limit: 4000 (suggestions: false)
```

### With suggestions (5000 tokens):

```bash
# Enable bulb icon, send message
🎯 Token limit: 5000 (suggestions: true)
```

---

## 5️⃣ Test Error Handling

### Test timeout:

1. Disconnect internet
2. Send message
3. Wait 60 seconds
4. Should see: "⚠️ AI response timeout"
5. Retry button appears

### Test socket disconnect:

1. Stop backend mid-response
2. Should see: "⚠️ Connection lost"
3. Message marked as error
4. Can retry message

### Test reconnect:

1. Restart backend
2. Socket auto-reconnects
3. Can send new messages
4. **Console log:** `✅ Socket reconnected`

---

## 🎯 Success Checklist

- [x] Database columns added (custom_instructions, roleplay_mode)
- [x] Backend starts without errors
- [x] "AI is typing..." shows during response
- [x] Streaming text appears character by character
- [x] Suggest mode uses 5000 tokens
- [x] Normal mode uses 4000 tokens
- [x] Custom instructions work
- [x] Roleplay modes change AI behavior
- [x] Timeout after 60s works
- [x] Retry button appears on error
- [x] Socket reconnect works

---

## 🐛 Troubleshooting

### AI not streaming?

**Check:**
1. Backend logs for `🤖 AI message placeholder created`
2. Frontend receives `ai_message_init` event
3. `isStreaming` state is true

**Console:**
```javascript
// Check socket events
socket.on('ai_message_init', console.log);
socket.on('ai_stream', console.log);
socket.on('ai_stream_end', console.log);
```

### "AI is typing..." stuck?

**Check:**
1. Backend emitted `ai_stream_end` event
2. Socket not disconnected
3. No errors in backend logs

**Fix:**
```javascript
// Manually clear if stuck
setChatState(prev => ({ ...prev, isStreaming: false }));
```

### Custom instructions not working?

**Check:**
1. Migration applied successfully
2. Settings saved (check Network tab)
3. User ID correct in socket auth
4. Backend loads preferences (see logs)

**Verify in database:**
```sql
SELECT custom_instructions, roleplay_mode 
FROM users 
WHERE email = 'your-email@example.com';
```

### Token limit not applied?

**Check backend logs:**
```
🎯 Token limit: 4000 (suggestions: false)
```

If missing, check:
1. `needs_suggestions` flag passed correctly
2. `generatorService.streamReply()` receives maxTokens
3. OpenAI API call includes `max_tokens`

---

## 📚 Documentation

- `docs/STREAMING_FIX.md` - Detailed streaming fix
- `docs/MIGRATION_GUIDE.md` - Database migrations
- `CHANGELOG.md` - All changes
- `docs/SETTINGS_IMPLEMENTATION.md` - Settings feature

---

## 🆘 Need Help?

1. Check browser console for errors
2. Check backend logs for errors
3. Verify database migrations applied
4. Test with simple messages first
5. Review event flow in `docs/STREAMING_FIX.md`

