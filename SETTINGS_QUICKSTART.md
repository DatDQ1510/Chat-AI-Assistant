# Quick Start: Settings Feature

## 🚀 1-Minute Setup

### Step 1: Apply Database Migration
```bash
cd Backend
psql -U postgres -d your_database_name -f src/db/migrations/20251020_add_user_preferences.sql
```

### Step 2: Restart Services
```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

### Step 3: Test Settings
1. Open browser → `http://localhost:5173`
2. Login to your account
3. Navigate to **Settings** page (gear icon or `/settings`)
4. Select language: **Tiếng Việt** 🇻🇳
5. Select style: **Formal** 🎩
6. Click **Save Settings** ✅
7. Go back to chat
8. Send message: "Xin chào, bạn có thể giúp tôi điều gì?"
9. AI responds in Vietnamese with formal tone! 🎉

## 📌 New Features

### 1️⃣ Bulb Icon (ChatInput)
- Click 💡 button to request AI suggestions
- Auto-sends: "Can you suggest some ideas or questions I could ask you?"

### 2️⃣ Symmetric Messages
- **Your messages**: Blue background, right-aligned
- **AI messages**: Gray background, left-aligned
- Clean, modern chat UI like WhatsApp/Telegram

### 3️⃣ Settings Page
Configure AI behavior:
- **Language**: 7 languages (EN, VI, JA, ZH, ES, FR, DE)
- **Style**: 6 tones (Formal, Friendly, Casual, Technical, Concise, Detailed)

## 🎯 API Endpoints

```bash
# Get settings
GET /api/user/settings
Authorization: Bearer <token>

# Update settings
PUT /api/user/settings
Authorization: Bearer <token>
Content-Type: application/json
{
  "language": "vi",
  "writing_style": "formal"
}
```

## 🔧 Troubleshooting

**Migration fails?**
```bash
# Check if columns already exist
psql -U postgres -d your_db_name
\d users
# If language/writing_style exist, skip migration
```

**Settings not saving?**
- Check browser console for errors
- Verify JWT token is valid
- Check backend logs for SQL errors

**AI not responding in selected language?**
- Wait 5 seconds after saving settings
- Send a new message (not in existing conversation)
- Check backend logs for "🎨 User preferences loaded"

## 📱 Demo Workflow

```
User: [Changes settings to Vietnamese + Formal]
User: "Giải thích AI là gì?"

AI: "Kính gửi Quý khách,

Trí tuệ nhân tạo (AI - Artificial Intelligence) là lĩnh vực khoa học máy tính 
nghiên cứu và phát triển các hệ thống có khả năng thực hiện các nhiệm vụ đòi hỏi 
trí thông minh của con người, chẳng hạn như:
- Nhận dạng hình ảnh và giọng nói
- Ra quyết định dựa trên dữ liệu
- Xử lý ngôn ngữ tự nhiên
- Học từ kinh nghiệm

Trân trọng,"
```

vs.

```
User: [Changes settings to English + Casual]
User: "What is AI?"

AI: "Hey! So AI (Artificial Intelligence) is basically computers doing smart stuff 
that usually needs human brains. Think of it like teaching machines to learn, 
recognize patterns, make decisions, and even chat with you (like I'm doing now!). 

It's everywhere these days - in your phone's face unlock, Netflix recommendations, 
and those annoying autocorrect fails 😅"
```

## ✅ Success Indicators

You'll know it's working when:
- Settings page loads your current preferences
- "Settings saved successfully!" message appears
- Backend logs show: `🎨 User preferences loaded: vi, formal`
- AI responds in selected language/style
- Messages appear symmetrically (blue right, gray left)
- Bulb icon sends suggestion request

---

For detailed technical documentation, see **SETTINGS_IMPLEMENTATION.md**
