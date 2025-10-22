# AI Chatbot Assistant - Copilot Instructions

## Architecture Overview

**Full-stack AI chat application** with real-time streaming, multi-tab sync, and personalized AI behavior.

### Tech Stack
- **Backend**: Node.js + TypeScript + Express + Socket.IO + PostgreSQL + Sequelize + Redis + BullMQ
- **Frontend**: React 18 + TypeScript + Vite + Ant Design + Socket.IO Client + React Router
- **AI**: OpenAI API (gpt-4o-mini) + Google Generative AI, streaming responses with 4000/5000 token limits

### Project Structure
```
Backend/src/
├── sockets/         # Socket.IO event handlers (chat.socket.ts = main chat logic)
├── services/        # Business logic (generator.service.ts, context.service.ts)
├── repositories/    # Data access layer (Sequelize queries)
├── controllers/     # REST API endpoints
├── models/          # Sequelize models (User, Conversation, Message)
├── queues/          # BullMQ job queues (message retry, summaries)
└── config/          # Database, Redis, OpenAI config

Frontend/src/
├── components/chat/ # ChatContainer.tsx = orchestrator, MessageList, ChatInput
├── contexts/        # AuthContext, SocketContext (Socket.IO connection)
├── services/        # API clients (axios)
├── utils/           # tabSync.ts = BroadcastChannel for multi-tab sync
└── types/           # TypeScript interfaces
```

## Critical Data Flows

### 1. Message Sending & AI Streaming (chat.socket.ts)
```typescript
// Flow: User sends → Backend saves → AI streams → All tabs sync
1. User types message → ChatContainer.handleSendMessage()
2. Optimistic UI: Add message with status='sending'
3. Broadcast to tabs: broadcastToTabs({ type: 'new_message', ... })
4. Socket emit: "send_message" → chat.socket.ts
5. Backend: Save user message → callback({ success: true })
6. Backend: Emit "ai_message_init" → Frontend shows "AI is typing..."
7. Backend: Stream AI response → Emit "ai_stream" chunks
8. Frontend: Append chunks + broadcast to all tabs
9. Backend: Emit "ai_stream_end" → Status = 'sent'
```

**Key Pattern**: Always broadcast to tabs IMMEDIATELY after state update (< 100ms), don't wait for API.

### 2. Multi-Tab Synchronization (tabSync.ts)
Uses **BroadcastChannel API** with 10 event types:
- `new_message`, `update_message`, `ai_message_init`, `ai_stream_chunk`, `ai_stream_end`
- `ai_error`, `new_conversation`, `delete_conversation`, `rename_conversation`, `streaming_status`

**Implementation**:
```typescript
// ChatContainer.tsx - Centralized event handler
useEffect(() => {
  const handler = (event: MessageEvent) => {
    const { type, payload } = event.data as TabSyncEvent;
    switch (type) {
      case 'ai_stream_chunk':
        // Update local state
        setMessagesMap(prev => ({ ...prev, [conversationId]: messages.map(...) }));
        break;
      // Handle all 10 event types
    }
  };
  chatChannel.addEventListener('message', handler);
  return () => chatChannel.removeEventListener('message', handler);
}, []);
```

**Duplicate Prevention**: Always check `messages.some(m => m.id === payload.message.id)` before adding.

### 3. AI Context Building (context.service.ts)
Personalizes AI responses using user preferences:
```typescript
// Dynamic system prompt construction:
1. Roleplay mode (ROLEPLAY_MAP): mentor, tutor, friend, professional, coach, expert
2. Custom instructions: User-defined behavior (e.g., "Always explain simply")
3. Language preference (LANGUAGE_MAP): en, vi, ja, zh, es, fr, de
4. Writing style (STYLE_MAP): formal, friendly, casual, technical, concise, detailed
5. Suggestions flag: Add follow-up questions (needs_suggestions=true → 5000 tokens)
```

**Token Management**: 
- Normal: 4000 tokens
- With suggestions: 5000 tokens
- Context truncation: `truncateByTokenBudget()` keeps recent messages within budget

## Development Workflows

### Backend Development
```bash
cd Backend
npm run dev          # Nodemon with hot reload
npm run build        # TypeScript compilation
npm run job:dev      # Background job worker (BullMQ)
```

### Frontend Development
```bash
cd Frontend
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # Production build
npm run lint         # ESLint check
```

### Database Migrations
```bash
cd Backend
psql -U postgres -d ai_chatbot -f src/db/migrations/<migration_file>.sql
```

**Pending Migration**: `20251020_add_custom_instructions.sql` adds `custom_instructions` and `roleplay_mode` to users table.

## Project-Specific Conventions

### Message Status Flow
```typescript
type MessageStatus = 'sending' | 'sent' | 'error';
// sending: Optimistic UI, waiting for backend
// sent: Backend confirmed, AI completed
// error: Failed, show retry button
```

**Retry Logic**:
- Max 2 retries, exponential backoff (2s, 4s)
- Only retry on timeout or 500 errors (not 400/401)
- Reset status to 'sending' before retry
- Use `sendMessageWithRetry()` in ChatContainer

### Error Handling Pattern
```typescript
// Backend: Never crash, always emit errors
try {
  const stream = await generatorService.streamReply(...);
  // ... streaming logic
} catch (aiError) {
  io.to(conversation_id).emit("ai_error", {
    message_id, conversation_id, error: "AI service unavailable", errorCode: 500
  });
  return; // Exit gracefully
}

// Frontend: Handle ai_error event
socket.on("ai_error", ({ message_id, conversation_id, error }) => {
  setMessagesMap(prev => ({
    ...prev,
    [conversation_id]: messages.map(m =>
      m.id === message_id ? { ...m, status: 'error', content: `⚠️ ${error}` } : m
    )
  }));
  broadcastToTabs({ type: 'ai_error', payload: { conversationId, messageId, error } });
});
```

### Socket.IO Patterns
- **Join rooms**: `socket.emit("join_conversation", conversationId)`
- **Callbacks**: Always provide response: `callback({ success: boolean, error?, errorCode? })`
- **Timeout**: 15s for message send, 60s for AI response
- **Disconnect handling**: Check if `currentAIMessageRef.current` exists → show specific error

### State Management
- **messagesMap**: `{ [conversationId: string]: Message[] }` - per-conversation messages
- **ChatState**: conversations array, currentConversationId, isLoading, isStreaming
- **loadedConversationsRef**: Set<string> to prevent duplicate API calls
- **Pagination**: Separate states for messages and conversations (5 messages/page for testing, 20 conversations/page)

### TypeScript Strict Patterns
```typescript
// Message role must be literal type
const userMessage: Message = {
  id: tempId,
  role: "user" as const,  // NOT "user" (string type won't work)
  content,
  timestamp: new Date(),
  status: 'sending' as const,
};
```

## Integration Points

### OpenAI API (generator.service.ts)
```typescript
// Streaming with max_tokens
const stream = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
  max_tokens: maxTokens,  // 4000 or 5000
  temperature: 0.7,
  stream: true
});
```

### Redis + BullMQ
- Message retry queue: Failed messages go to BullMQ for background retry
- Summary generation queue: Conversation summaries (not yet implemented)
- Config: `Backend/src/config/redis.ts`

### Database (Sequelize + PostgreSQL)
- Models: User, Conversation, Message
- UUID primary keys (auto-generated by PostgreSQL)
- Timestamps: `createdAt`, `updatedAt` on all models
- Soft delete: Not implemented (use hard delete)

## Common Pitfalls & Solutions

1. **Tab sync delay?** → Broadcast IMMEDIATELY after state update, not after API
2. **Duplicate messages?** → Check `messages.some(m => m.id === payload.message.id)` before adding
3. **Backend crash on network error?** → Wrap AI calls in try-catch, emit `ai_error` event
4. **Retry button persists?** → Reset status to 'sending' at start of retry: `{ ...m, status: 'sending' }`
5. **TypeScript error on message role?** → Use `role: "user" as const` not `role: "user"`
6. **Socket disconnect not handled?** → Check `currentAIMessageRef.current` to show context-aware error
7. **AI streaming not syncing?** → Emit `broadcastToTabs({ type: 'ai_stream_chunk', ... })` after each chunk

## Key Files to Reference

- **Socket orchestration**: `Backend/src/sockets/chat.socket.ts` (187 lines, event handlers)
- **Tab sync logic**: `Frontend/src/components/chat/ChatContainer.tsx` (~1500 lines, main orchestrator)
- **Tab sync events**: `Frontend/src/utils/tabSync.ts` (BroadcastChannel API)
- **AI context**: `Backend/src/services/context.service.ts` (ROLEPLAY_MAP, user preferences)
- **Message status**: `Frontend/src/components/chat/MessageItem.tsx` (visual indicators)
- **Error handling**: See both `chat.socket.ts` (backend) and `ChatContainer.tsx` (frontend)

## Testing Strategy

**Manual Test Flow**:
1. Open 2-3 tabs with same conversation
2. Tab 1: Send message → Tab 2/3 should see it in < 100ms
3. Tab 1: See AI streaming → Tab 2/3 should see chunks in real-time
4. Tab 1: Create/delete/rename conversation → Tab 2/3 should sync instantly
5. Tab 1: Disconnect network, send → All tabs show error + retry button
6. Tab 1: Retry success → All tabs remove error, show 'sent' status

**Performance Targets**:
- Tab sync: < 100ms
- AI streaming: Real-time (< 50ms chunk delay)
- Message status: Synchronized across all tabs
- Zero duplicates

## Documentation References

- **Tab sync details**: `docs/TAB_SYNC_OPTIMIZATION.md`
- **Performance comparison**: `docs/TAB_SYNC_COMPARISON.md`
- **Full optimization summary**: `OPTIMIZATION_SUMMARY.md`
- **Migration guide**: Apply `Backend/src/db/migrations/20251020_add_custom_instructions.sql`

---

**Last Updated**: October 21, 2025 | **Status**: Production-ready (pending migration)
