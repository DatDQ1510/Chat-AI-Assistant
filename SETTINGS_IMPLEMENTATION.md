# Settings Feature Implementation Guide

## 🎯 Overview
Implemented user preferences system allowing users to customize:
- **Response Language**: AI responds in user's preferred language (Vietnamese, English, Japanese, etc.)
- **Writing Style**: AI adapts tone (Formal, Friendly, Casual, Technical, Concise, Detailed)

## ✅ Completed Features

### 1. 💡 Bulb Icon for AI Suggestions
**Location**: `Frontend/src/components/chat/ChatInput.tsx`
- Added **BulbOutlined** icon button
- Clicking sends: "Can you suggest some ideas or questions I could ask you about this conversation?"
- Position: Between attachment button and text input

### 2. 💬 Symmetric Message Layout
**Location**: `Frontend/src/components/chat/MessageItem.tsx`
- **User messages**: Right-aligned, blue background (#0284c7), white text
- **AI messages**: Left-aligned, gray background (#f3f4f6), dark text
- **Avatars**: Circular, distinct colors for user/AI
- **Max width**: 70% to prevent full-width messages

### 3. 🗄️ Database Schema Update
**Location**: `Backend/src/models/user.model.ts`
**New fields**:
```typescript
language?: string; // 'en', 'vi', 'ja', 'zh', 'es', 'fr', 'de'
writing_style?: string; // 'formal', 'friendly', 'casual', 'technical', 'concise', 'detailed'
```

**Defaults**:
- `language`: 'en' (English)
- `writing_style`: 'friendly'

### 4. 🔧 Backend API Endpoints
**Location**: `Backend/src/controllers/user.controller.ts`, `Backend/src/routes/user.routes.ts`

#### GET `/api/user/settings`
**Auth**: Required (Bearer token)
**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "language": "en",
  "writing_style": "friendly"
}
```

#### PUT `/api/user/settings`
**Auth**: Required (Bearer token)
**Body**:
```json
{
  "language": "vi",
  "writing_style": "formal"
}
```
**Response**:
```json
{
  "message": "Settings updated successfully",
  "settings": {
    "language": "vi",
    "writing_style": "formal"
  }
}
```

### 5. 🎨 Settings Page UI
**Location**: `Frontend/src/pages/SettingsPage.tsx`

**Features**:
- Language selector with 7 languages (flags + names)
- Writing style selector with 6 styles (icons + descriptions)
- Real-time form validation
- Loading states during fetch/save
- User profile display (name, email)
- Success/error notifications

**Supported Languages**:
- 🇬🇧 English
- 🇻🇳 Tiếng Việt
- 🇯🇵 日本語 (Japanese)
- 🇨🇳 中文 (Chinese)
- 🇪🇸 Español (Spanish)
- 🇫🇷 Français (French)
- 🇩🇪 Deutsch (German)

**Writing Styles**:
- 🎩 **Formal**: Professional, polite tone
- 😊 **Friendly**: Warm, approachable
- 💬 **Casual**: Conversational, relaxed
- 🔧 **Technical**: Expert terminology
- ⚡ **Concise**: Brief, to the point
- 📚 **Detailed**: Comprehensive explanations

### 6. 🤖 AI Context Integration
**Location**: `Backend/src/services/context.service.ts`

**How it works**:
1. When user sends message, `buildPrompt()` fetches user preferences from DB
2. Constructs dynamic system prompt:
   ```
   You are an AI assistant. Respond in Vietnamese (Tiếng Việt). Use formal, professional language with proper grammar and polite tone.
   ```
3. Injects into OpenAI API call
4. AI adapts responses accordingly

**Language Mapping**:
```typescript
const LANGUAGE_MAP = {
  en: "English",
  vi: "Vietnamese (Tiếng Việt)",
  ja: "Japanese (日本語)",
  zh: "Chinese (中文)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)",
};
```

**Style Instructions**:
```typescript
const STYLE_MAP = {
  formal: "Use formal, professional language with proper grammar and polite tone.",
  friendly: "Use friendly, warm language while maintaining professionalism.",
  casual: "Use casual, conversational language as if chatting with a friend.",
  technical: "Use technical terminology and detailed explanations suitable for experts.",
  concise: "Keep responses brief and to the point, avoiding unnecessary details.",
  detailed: "Provide comprehensive, thorough explanations with examples.",
};
```

## 📦 Database Migration

**File**: `Backend/src/db/migrations/20251020_add_user_preferences.sql`

**Run migration**:
```bash
cd Backend
# Connect to PostgreSQL
psql -U postgres -d your_database_name -f src/db/migrations/20251020_add_user_preferences.sql
```

**SQL Commands**:
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS writing_style VARCHAR(50) DEFAULT 'friendly';

COMMENT ON COLUMN users.language IS 'User preferred response language (vi, en, ja, etc.)';
COMMENT ON COLUMN users.writing_style IS 'AI writing style preference (formal, casual, technical, friendly)';
```

## 🚀 Testing Instructions

### 1. Apply Database Migration
```bash
cd Backend
psql -U postgres -d chatbot_db -f src/db/migrations/20251020_add_user_preferences.sql
```

### 2. Restart Backend Server
```bash
cd Backend
npm run dev
```

### 3. Test Settings API
```bash
# Get current settings
curl -X GET http://localhost:5000/api/user/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update settings
curl -X PUT http://localhost:5000/api/user/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language": "vi", "writing_style": "formal"}'
```

### 4. Test Frontend
1. Login to the app
2. Navigate to `/settings` page
3. Change language to **Tiếng Việt**
4. Change writing style to **Formal**
5. Click **Save Settings**
6. Go back to chat
7. Send a message
8. Verify AI responds in Vietnamese with formal tone

### 5. Test Message Layout
- Send user message → Should appear **right-aligned** with **blue background**
- Receive AI response → Should appear **left-aligned** with **gray background**
- Click **bulb icon** → Should request AI suggestions

## 🔍 Code Changes Summary

### Backend Files Modified/Created:
1. ✅ `Backend/src/models/user.model.ts` - Added language, writing_style fields
2. ✅ `Backend/src/controllers/user.controller.ts` - Added getUserSettings, updateUserSettings
3. ✅ `Backend/src/routes/user.routes.ts` - Added GET/PUT /settings endpoints
4. ✅ `Backend/src/services/context.service.ts` - Integrated preferences into AI prompt
5. ✅ `Backend/src/sockets/chat.socket.ts` - Pass userId to buildPrompt
6. ✅ `Backend/src/db/migrations/20251020_add_user_preferences.sql` - Migration file

### Frontend Files Modified/Created:
1. ✅ `Frontend/src/components/chat/ChatInput.tsx` - Added bulb icon
2. ✅ `Frontend/src/components/chat/MessageItem.tsx` - Symmetric layout
3. ✅ `Frontend/src/pages/SettingsPage.tsx` - Complete settings UI
4. ✅ `Frontend/src/services/user.service.ts` - Settings API client

## 📝 Next Steps

### Optional Enhancements:
1. **Add more languages**: Korean, Arabic, Hindi, etc.
2. **Custom system prompts**: Let users write their own AI instructions
3. **Response length control**: Slider for short/medium/long responses
4. **Temperature control**: Adjust AI creativity level
5. **Save conversation themes**: Light/dark mode per conversation
6. **Export settings**: JSON import/export for backup

### Performance Optimizations:
1. **Cache user preferences**: Store in Redis to avoid DB query on every message
2. **Batch updates**: Update multiple settings in one API call
3. **Settings sync**: WebSocket event to update UI when settings change

## ⚠️ Important Notes

1. **Migration is required**: Database schema must be updated before using settings
2. **Existing users**: Will default to English/Friendly until they update settings
3. **Token estimation**: Longer system prompts consume more tokens
4. **Language support**: AI quality varies by language (English is best)
5. **Style adherence**: AI tries to follow style but may not be 100% consistent

## 🎉 Result

Users can now:
- ✅ Customize AI language (7 languages supported)
- ✅ Adjust AI tone (6 writing styles)
- ✅ See messages in symmetric chat layout
- ✅ Request AI suggestions with bulb icon
- ✅ Save preferences that persist across sessions
- ✅ See preferences applied in real-time during conversations

Enjoy your personalized AI chatbot! 🚀
