# AI Chatbot Assistant - Tài Liệu Dự Án

##  Tổng Quan Dự Án

**AI Chatbot Assistant** là ứng dụng chat AI full-stack với khả năng streaming real-time, đồng bộ đa tab, và cá nhân hóa hành vi AI.

###  Mục Đích
- Cung cấp trải nghiệm chat AI mượt mà với streaming responses
- Đồng bộ hóa real-time giữa nhiều tabs/windows
- Cá nhân hóa AI dựa trên preferences của user
- Quản lý conversations, projects, và messages hiệu quả
- Hỗ trợ upload files (PDF, images, videos) với OCR và vision AI

---

##  Kiến Trúc Hệ Thống

### Tech Stack

#### Backend
- **Runtime**: Node.js 22 (Alpine)
- **Framework**: Express 5.1.0
- **Language**: TypeScript 5.9.3
- **Database**: PostgreSQL 15 + pgvector extension
- **Cache/Queue**: Redis 7 + BullMQ 5.61.0
- **Real-time**: Socket.IO 4.8.1
- **AI Integration**: 
  - OpenAI API 6.2.0 (gpt-4o-mini)
  - Google Generative AI 0.24.1 (Gemini)
- **File Processing**: 
  - Tesseract.js 6.0.1 (OCR)
  - pdf-parse 1.1.1
  - Cloudinary 2.8.0 (cloud storage)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **ORM**: Sequelize 6.37.7

#### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **UI Library**: Ant Design 5.27.4
- **Routing**: React Router 7.9.3
- **Real-time**: Socket.IO Client 4.8.1
- **Markdown**: react-markdown 10.1.0 + remark-gfm + rehype-highlight
- **Drag & Drop**: @dnd-kit 6.3.1
- **Animation**: framer-motion 12.23.22
- **HTTP Client**: Axios 1.12.2

### Cấu Trúc Thư Mục

```
AI Chatbot Assistant/
├── Backend/
│   ├── src/
│   │   ├── sockets/          # Socket.IO event handlers
│   │   │   └── chat.socket.ts      # Main chat logic
│   │   ├── services/         # Business logic layer
│   │   │   ├── generator.service.ts    # AI streaming
│   │   │   ├── context.service.ts      # AI context building
│   │   │   ├── memory.service.ts       # Long-term memory
│   │   │   └── embedding.service.ts    # Vector embeddings
│   │   ├── repositories/     # Data access layer (Sequelize)
│   │   ├── controllers/      # REST API endpoints
│   │   ├── models/           # Database models
│   │   │   ├── user.model.ts
│   │   │   ├── conversation.model.ts
│   │   │   ├── message.model.ts
│   │   │   ├── project.model.ts
│   │   │   └── memory.model.ts
│   │   ├── queues/           # BullMQ job queues
│   │   │   ├── message.queue.ts        # Message retry
│   │   │   ├── summary.queue.ts        # Conversation summaries
│   │   │   └── memory.queue.ts         # Memory extraction
│   │   ├── middlewares/      # Auth, error handling, file upload
│   │   ├── routes/           # Express routes
│   │   ├── config/           # Database, Redis, OpenAI config
│   │   ├── utils/            # Helper functions
│   │   ├── types/            # TypeScript type definitions
│   │   ├── memory/           # Memory extraction logic
│   │   ├── db/migrations/    # SQL migration files
│   │   ├── schedules/        # Cron jobs
│   │   ├── server.ts         # Main server entry
│   │   ├── app.ts            # Express app configuration
│   │   └── job/index.ts      # Background worker
│   ├── Dockerfile.backend
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatContainer.tsx       # Main orchestrator (~900 lines)
│   │   │   │   ├── ChatSidebar.tsx         # Conversations + Projects
│   │   │   │   ├── MessageList.tsx         # Message rendering
│   │   │   │   ├── MessageItem.tsx         # Individual message
│   │   │   │   ├── ChatInput.tsx           # User input + file upload
│   │   │   │   ├── ConversationItem.tsx    # Conversation list item
│   │   │   │   ├── ProjectItem.tsx         # Project management
│   │   │   │   ├── SettingsDrawer.tsx      # User settings
│   │   │   │   ├── ImportantDrawer.tsx     # Important messages
│   │   │   │   ├── SearchModal.tsx         # Full-text search
│   │   │   │   ├── SemanticChatDrawer.tsx  # Semantic search
│   │   │   │   └── DragAndDropProvider.tsx # Drag & drop context
│   │   │   ├── auth/           # Sign in/up components
│   │   │   └── stream/         # Markdown renderer
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx          # Authentication state
│   │   │   └── SocketContext.tsx        # Socket.IO connection
│   │   ├── hooks/
│   │   │   ├── useConversations.ts      # Conversation CRUD
│   │   │   ├── useMessages.ts           # Message loading/pagination
│   │   │   ├── useSendMessage.ts        # Message sending logic
│   │   │   ├── useSocketEvents.ts       # Socket event handlers
│   │   │   ├── useTabSync.ts            # Multi-tab sync
│   │   │   └── useProjects.ts           # Project management
│   │   ├── services/         # API client (axios)
│   │   │   ├── auth.service.ts
│   │   │   ├── conversation.service.ts
│   │   │   ├── message.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── upload.service.ts
│   │   ├── utils/
│   │   │   ├── tabSync.ts               # BroadcastChannel API
│   │   │   └── chat.ts                  # Message formatting
│   │   ├── types/            # TypeScript interfaces
│   │   ├── pages/            # Route pages
│   │   ├── routes/           # React Router config
│   │   ├── config/           # API base URL
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
├── Database/
│   ├── Dockerfile
│   └── init/uuid.sql
│
├── docker-compose.yml
├── .github/copilot-instructions.md
└── docs/

```

---

##  Tính Năng Chính

### 1. Real-time AI Chat với Streaming
- **AI Models**: OpenAI GPT-4o-mini, Google Gemini
- **Streaming Responses**: Hiển thị từng token khi AI generate
- **Token Limits**: 
  - Normal: 4000 tokens
  - With suggestions: 5000 tokens
- **Context Management**: Truncate messages để fit budget
- **Retry Logic**: Max 2 retries với exponential backoff (2s, 4s)

### 2. Multi-Tab Synchronization
- **Technology**: BroadcastChannel API
- **Performance**: < 100ms sync latency
- **Event Types** (10):
  - `new_message`, `update_message`
  - `ai_message_init`, `ai_stream_chunk`, `ai_stream_end`
  - `ai_error`, `new_conversation`, `delete_conversation`
  - `rename_conversation`, `streaming_status`
- **Duplicate Prevention**: Check message ID trước khi add
- **Real-time**: Tất cả tabs đồng bộ ngay lập tức

### 3. Conversation Management
- **Features**:
  - Create/Rename/Delete conversations
  - Organize by Projects
  - Tag conversations (work, study, personal, etc.)
  - Search conversations (full-text + semantic)
  - Mark messages as important
  - Pagination (20 conversations/page)

### 4. Project Organization
- **Drag & Drop**: Move conversations between projects
- **Nested Structure**: Projects contain multiple conversations
- **Auto-expand**: Show conversations when project selected
- **Real-time Sync**: Updates propagate to all tabs

### 5. File Upload & Processing
- **Supported Types**: PDF, Images (JPG, PNG, WebP), Videos
- **Max Size**: 10MB per file
- **OCR**: Tesseract.js extracts text from images
- **PDF Parse**: Extract text và metadata
- **Vision AI**: Google Gemini analyzes images
- **Storage**: Cloudinary cloud storage
- **Preview**: Show thumbnails cho images

### 6. AI Personalization
- **Roleplay Modes**: mentor, tutor, friend, professional, coach, expert
- **Languages**: English, Tiếng Việt, 日本語, 中文, Español, Français, Deutsch
- **Writing Styles**: formal, friendly, casual, technical, concise, detailed
- **Custom Instructions**: User-defined AI behavior (max 500 chars)
- **Follow-up Suggestions**: AI generate câu hỏi tiếp theo

### 7. Memory System
- **Long-term Memory**: Extract và store user preferences
- **Embedding Search**: pgvector với OpenAI embeddings
- **Contextual Recall**: Retrieve relevant memories trong conversations
- **Automatic Extraction**: Background job analyze messages

### 8. Search Capabilities
- **Full-text Search**: Search trong tất cả messages
- **Semantic Search**: Vector similarity search với embeddings
- **Filter by Conversation**: Search within specific conversation
- **Highlight Results**: Show relevance scores

---

##  Data Flows

### Message Sending Flow
```
1. User types → ChatInput.handleSend()
2. Optimistic UI: Add message (status='sending', isTemp=true)
3. Broadcast to tabs: broadcastToTabs({ type: 'new_message', ... })
4. Socket emit: socket.emit("send_message", payload, callback)
5. Backend: Save to DB → emit("user_message_saved", savedMessage)
6. Frontend: Replace temp message với real message (có ID from DB)
7. Backend: Call AI service → emit("ai_message_init", aiMessage)
8. Frontend: Add AI message placeholder
9. Backend: Stream chunks → emit("ai_stream", { chunk })
10. Frontend: Append chunks + broadcast to all tabs
11. Backend: Complete → emit("ai_stream_end", { fullContent, realMessageId })
12. Frontend: Update status='sent', isStreaming=false
```

### Multi-Tab Sync Flow
```
Tab A: User action (send message, delete conversation, etc.)
    ↓
Update local state (optimistic UI)
    ↓
broadcastToTabs({ type: 'event_type', payload: {...} })
    ↓
BroadcastChannel → All tabs (A, B, C)
    ↓
Tab B, C: useTabSync hook receives event
    ↓
Update local state to match Tab A
    ↓
UI re-renders automatically (< 100ms)
```

### AI Context Building
```
1. Get user settings (language, style, roleplay, custom_instructions)
2. Load conversation messages (paginated)
3. Truncate to fit token budget (4000 or 5000 tokens)
4. Build system prompt:
   - Roleplay persona
   - Language preference
   - Writing style
   - Custom instructions
   - Suggestions flag (if enabled)
5. Construct messages array: [system, ...history, user_input]
6. Call OpenAI/Gemini API với streaming
7. Return stream to frontend
```

---

##  Database Schema

### Users Table
```sql
id (UUID, PK)
username (VARCHAR, UNIQUE)
email (VARCHAR, UNIQUE)
password_hash (VARCHAR)
firstname (VARCHAR)
lastname (VARCHAR)
language (VARCHAR DEFAULT 'en')
writing_style (VARCHAR DEFAULT 'friendly')
roleplay_mode (VARCHAR)
custom_instructions (TEXT)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)
```

### Conversations Table
```sql
id (UUID, PK)
user_id (UUID, FK → users.id)
project_id (UUID, FK → projects.id, nullable)
conversation_name (VARCHAR)
conversation_tag (VARCHAR, nullable)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)
```

### Messages Table
```sql
id (UUID, PK)
conversation_id (UUID, FK → conversations.id)
role (ENUM: 'user', 'assistant')
content (TEXT)
attachments (JSONB, nullable)
important (BOOLEAN DEFAULT false)
suggestions (JSONB, nullable)
createdAt (TIMESTAMP)
```

### Projects Table
```sql
id (UUID, PK)
user_id (UUID, FK → users.id)
name (VARCHAR)
description (TEXT, nullable)
order_index (INTEGER)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)
```

### Memories Table
```sql
id (UUID, PK)
user_id (UUID, FK → users.id)
conversation_id (UUID, FK → conversations.id, nullable)
content (TEXT)
embedding (VECTOR(1536))
createdAt (TIMESTAMP)
```

---

## API Endpoints

### Authentication
- `POST /v1/api/auth/register` - Register new user
- `POST /v1/api/auth/login` - Login (returns JWT)
- `POST /v1/api/auth/refresh` - Refresh access token
- `POST /v1/api/auth/logout` - Logout

### Conversations
- `GET /v1/api/conversations` - List user's conversations (paginated)
- `POST /v1/api/conversations` - Create new conversation
- `GET /v1/api/conversations/:id` - Get conversation details
- `PUT /v1/api/conversations/:id` - Rename conversation
- `DELETE /v1/api/conversations/:id` - Delete conversation
- `PATCH /v1/api/conversations/:id/tag` - Update conversation tag
- `PATCH /v1/api/conversations/:id/project` - Move to project

### Messages
- `GET /v1/api/messages/:conversationId` - Get messages (paginated)
- `POST /v1/api/messages` - Send message (deprecated, use Socket.IO)
- `GET /v1/api/messages/:conversationId/search` - Search messages
- `PATCH /v1/api/messages/:id/important` - Toggle important flag
- `GET /v1/api/messages/:conversationId/important` - Get important messages

### Projects
- `GET /v1/api/projects` - List user's projects
- `POST /v1/api/projects` - Create new project
- `PUT /v1/api/projects/:id` - Update project
- `DELETE /v1/api/projects/:id` - Delete project
- `GET /v1/api/projects/:id/conversations` - Get project conversations

### Users
- `GET /v1/api/users/me` - Get current user info
- `GET /v1/api/users/settings` - Get user settings
- `PUT /v1/api/users/settings` - Update user settings

### File Upload
- `POST /v1/api/upload` - Upload file to Cloudinary

---

##  Socket.IO Events

### Client → Server

#### `join_conversation`
```typescript
socket.emit("join_conversation", conversationId: string)
```
Join conversation room để receive updates.

#### `send_message`
```typescript
socket.emit("send_message", {
  conversation_id: string,
  content: string,
  attachments?: Array<{
    url: string,
    type: string,
    name: string
  }>,
  needs_suggestions?: boolean
}, (response: { success: boolean, error?: string }) => void)
```

#### `get_conversation_starters`
```typescript
socket.emit("get_conversation_starters", {
  conversation_id: string
})
```

#### `generate_suggestions`
```typescript
socket.emit("generate_suggestions", {
  conversation_id: string,
  message_id: string
})
```

### Server → Client

#### `receive_message`
```typescript
socket.on("receive_message", (message: Message, callback) => {
  // Handle new message
  callback({ received: true, messageId: message.id });
})
```

#### `user_message_saved`
```typescript
socket.on("user_message_saved", (savedMessage: Message) => {
  // Replace temp message with real saved message
})
```

#### `ai_message_init`
```typescript
socket.on("ai_message_init", (aiMessage: Message) => {
  // Show "AI is typing..." placeholder
})
```

#### `ai_stream`
```typescript
socket.on("ai_stream", (data: { 
  message_id: string, 
  conversation_id: string, 
  chunk: string 
}) => {
  // Append chunk to AI message
})
```

#### `ai_stream_end`
```typescript
socket.on("ai_stream_end", (data: {
  message_id: string,
  conversation_id: string,
  realMessageId: string,
  fullContent: string,
  suggestions?: string[]
}) => {
  // Finalize AI message
})
```

#### `ai_error`
```typescript
socket.on("ai_error", (data: {
  message_id: string,
  conversation_id: string,
  error: string,
  errorCode: number
}) => {
  // Show error message
})
```

#### `conversation_starters`
```typescript
socket.on("conversation_starters", (data: {
  conversation_id: string,
  starters: string[]
}) => {
  // Display conversation starters
})
```

---

## Deployment

### Development

#### Backend
```bash
cd Backend
npm install
npm run dev          # Nodemon hot reload
npm run job:dev      # Background worker
```

#### Frontend
```bash
cd Frontend
npm install
npm run dev          # Vite dev server (http://localhost:5173)
```

### Production (Docker)

#### Docker Compose (Full Stack)
```bash
docker-compose up --build -d
```

Services:
- **database**: PostgreSQL 15 with pgvector
- **redis**: Redis 7
- **backend**: Node.js API server (port 5000)
- **worker**: BullMQ background worker
- **frontend**: Nginx serving React app (port 80)

#### Environment Variables

**Backend (.env)**
```env
NODE_ENV=production
PORT=5000

# Database
DB_HOST=database
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=ai_chatbot

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret

# AI APIs
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIzaSy...
BASE_URL=https://api.openai.com/v1
MAX_OUTPUT_TOKENS=250
MAX_CONTEXT_TOKENS=2500
EMBEDDING_DIMENSION=1536

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Production URLs (for Render deployment)
DOMAIN=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.onrender.com
```

**Frontend (.env.production)**
```env
VITE_API_URL=https://your-backend.onrender.com
```

### Production (Render.com)

#### Backend Setup
1. Create Web Service từ GitHub repo
2. Build Command: `cd Backend && npm ci && npm run build`
3. Start Command: `cd Backend && npm run start`
4. Add PostgreSQL addon (with SSL)
5. Add Redis addon (with TLS)
6. Set environment variables
7. Auto-deploy on push to master

#### Frontend Setup
1. Create Static Site từ GitHub repo
2. Build Command: `cd Frontend && npm ci && npm run build`
3. Publish Directory: `Frontend/dist`
4. Set `VITE_API_URL` environment variable
5. Auto-deploy on push to master

---

##  Testing

### Manual Testing Checklist

#### Multi-Tab Sync
- [ ] Open 3 tabs cùng conversation
- [ ] Tab 1: Send message → Tab 2,3 see trong < 100ms
- [ ] Tab 1: AI streaming → Tab 2,3 see chunks real-time
- [ ] Tab 1: Create/delete/rename conversation → Tab 2,3 sync
- [ ] Tab 1: Mark message important → Tab 2,3 update
- [ ] Disconnect network → All tabs show error + retry button
- [ ] Retry success → All tabs show 'sent' status

#### File Upload
- [ ] Upload PDF → Extract text successfully
- [ ] Upload image → OCR extracts text
- [ ] Upload video → Store in Cloudinary
- [ ] File size > 10MB → Show error
- [ ] Multiple files → All upload successfully
- [ ] Paste image (Ctrl+V) → Auto upload

#### AI Personalization
- [ ] Change language → AI responds in new language
- [ ] Change writing style → AI tone changes
- [ ] Set roleplay mode → AI adopts persona
- [ ] Add custom instructions → AI follows them
- [ ] Generate suggestions → Show follow-up questions

#### Search
- [ ] Full-text search → Find matching messages
- [ ] Semantic search → Find similar content
- [ ] Search in conversation → Filter by conversation
- [ ] Click result → Scroll to message

### Performance Targets
- Tab sync latency: < 100ms
- AI first chunk: < 1s
- Message pagination: < 500ms
- Search results: < 1s
- File upload: < 5s (10MB file)

---

##  Common Issues & Solutions

### 1. Tab Sync Delay
**Problem**: Messages không sync ngay
**Solution**: Broadcast IMMEDIATELY sau state update, không đợi API response

### 2. Duplicate Messages
**Problem**: Message xuất hiện 2 lần
**Solution**: Check `messages.some(m => m.id === payload.message.id)` trước khi add

### 3. AI Streaming Not Working
**Problem**: Không thấy chunks stream
**Solution**: 
- Check Socket.IO connection
- Verify `ai_stream` event listener
- Ensure broadcast to tabs sau mỗi chunk

### 4. Socket Disconnect
**Problem**: Connection bị đứt
**Solution**:
- Implement reconnection logic
- Show user-friendly error message
- Reset state on reconnect

### 5. File Upload Failed
**Problem**: Upload lỗi
**Solution**:
- Check file size < 10MB
- Verify Cloudinary credentials
- Check file type whitelist

### 6. TypeScript Errors
**Problem**: Type mismatch errors
**Solution**:
- Use `as const` cho message role
- Define strict types trong interfaces
- Enable strict mode trong tsconfig.json

### 7. CORS Issues (Production)
**Problem**: Frontend không call được backend
**Solution**:
- Add frontend URL vào backend CORS origins
- Set credentials: true
- Match Socket.IO CORS với Express CORS

---

## Code Conventions

### Message Status Flow
```typescript
type MessageStatus = 'sending' | 'sent' | 'error';

// sending: Optimistic UI, đang đợi backend
// sent: Backend confirmed, AI complete
// error: Failed, show retry button
```

### Error Handling
```typescript
// Backend: Never crash, always emit errors
try {
  const stream = await generatorService.streamReply(...);
} catch (aiError) {
  io.to(conversation_id).emit("ai_error", {
    message_id,
    conversation_id,
    error: "AI service unavailable",
    errorCode: 500
  });
  return; // Exit gracefully
}
```

### TypeScript Patterns
```typescript
// CORRECT: Use literal types
const message: Message = {
  role: "user" as const,
  status: 'sending' as const,
  // ...
};

//  WRONG: String type won't work
const message: Message = {
  role: "user", // Type error!
  // ...
};
```
