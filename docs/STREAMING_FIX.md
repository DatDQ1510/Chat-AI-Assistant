# 🔧 AI Streaming & Token Limit Fix

## 📋 Tổng quan vấn đề

### Vấn đề gặp phải:
1. ❌ Không hiển thị "AI is typing..." 
2. ❌ Không thấy streaming chunks từ AI (không hiển thị từng chữ)
3. ❌ Cần giới hạn token: 4000 (thông thường), 5000 (có suggestions)

### Nguyên nhân:
- Backend tạo AI placeholder là **chuỗi rỗng** (`""`) thay vì object message
- Backend phát `ai_message_init` event với data không đúng format
- Thiếu tham số `max_tokens` trong API call
- Flow xử lý message không đúng thứ tự

---

## ✅ Giải pháp đã implement

### 1. **Backend - chat.socket.ts**

#### Thay đổi flow xử lý message:

**Trước:**
```typescript
let aiPlaceholder = "";  // ❌ Sai: chuỗi rỗng
io.to(conversation_id).emit("ai_message_init", aiPlaceholder);
```

**Sau:**
```typescript
// 1. Save user message
const userMessage = await messageService.createMessage(...);

// 2. Broadcast user message
io.to(conversation_id).emit("receive_message", {
  id: userMessage.id,
  conversation_id,
  role: "user",
  content,
  ...
});

// 3. Create AI placeholder in database
const aiMessage = await messageService.createMessage(
  conversation_id,
  "chatbot",
  null,
  null,
  "" // Empty initially
);

// 4. Emit AI init with proper object
io.to(conversation_id).emit("ai_message_init", {
  id: aiMessage.id,
  conversation_id,
  role: "assistant",
  content: "",
  created_at: new Date().toISOString(),
});

// 5. Stream AI response
const maxTokens = needs_suggestions ? 5000 : 4000;
const stream = await generatorService.streamReply(
  context.systemPrompt, 
  context.userPrompt, 
  maxTokens
);

// 6. Stream chunks
for await (const chunkObj of stream) {
  io.to(conversation_id).emit("ai_stream", {
    message_id: aiMessage.id,
    chunk: chunkText,
    conversation_id
  });
}

// 7. Update database with full content
await messageService.updateMessageContent(aiMessage.id, aiFullReply);

// 8. Emit stream end
io.to(conversation_id).emit("ai_stream_end", {
  message_id: aiMessage.id,
  full_content: aiFullReply,
  conversation_id
});
```

### 2. **Backend - generator.service.ts**

#### Thêm giới hạn token:

```typescript
async streamReply(
  systemPrompt: string, 
  userPrompt: string, 
  maxTokens: number = 4000  // ✅ Default 4000
): Promise<AsyncGenerator<string>> {
  const stream = await this.model.chat.completions.stream({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,  // ✅ Giới hạn token
    temperature: 0.7,
  });
  
  async function* chunkGenerator() {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
  
  return chunkGenerator();
}
```

#### Token limits:
- **4000 tokens**: Normal messages (no suggestions)
- **5000 tokens**: Messages with suggestions flag (`needs_suggestions: true`)

### 3. **Frontend - ChatContainer.tsx**

#### Event handlers đã có sẵn:

```typescript
// ✅ AI bắt đầu typing
socket.on("ai_message_init", (aiMessage) => {
  setIsWaitingForAI(false);
  setChatState(prev => ({ ...prev, isStreaming: true }));
  
  setMessagesMap(prev => ({
    ...prev,
    [convId]: [
      ...(prev[convId] || []),
      {
        id: aiMessage.id,
        role: "assistant",
        content: "",
        isStreaming: true,  // ✅ Hiện loading spinner
        timestamp: new Date(),
      },
    ],
  }));
});

// ✅ Nhận từng chunk
socket.on("ai_stream", ({ message_id, chunk, conversation_id }) => {
  setMessagesMap(prev => ({
    ...prev,
    [conversation_id]: (prev[conversation_id] || []).map(m =>
      m.id === message_id 
        ? { ...m, content: (m.content || "") + chunk }  // ✅ Append chunk
        : m
    ),
  }));
});

// ✅ AI trả lời xong
socket.on("ai_stream_end", ({ message_id, full_content, conversation_id }) => {
  setChatState(prev => ({ ...prev, isStreaming: false }));
  
  setMessagesMap(prev => ({
    ...prev,
    [conversation_id]: (prev[conversation_id] || []).map(m =>
      m.id === message_id
        ? { ...m, content: full_content, isStreaming: false, status: 'sent' }
        : m
    ),
  }));
});
```

---

## 🎯 Kết quả

### ✅ Các tính năng đã hoạt động:

1. **AI is typing indicator**: 
   - Hiện "AI is typing..." khi `isStreaming: true`
   - Spinner trong message khi `isStreaming: true`

2. **Streaming chunks**: 
   - Hiển thị từng chữ AI trả lời realtime
   - Append chunk vào content

3. **Token limits**:
   - 4000 tokens cho message thông thường
   - 5000 tokens khi enable suggestions (`needs_suggestions: true`)

4. **Error handling**:
   - Timeout 60s nếu AI không response
   - Retry button cho failed messages
   - Socket disconnect handling

---

## 🧪 Testing

### Test AI streaming:
1. Gửi message bình thường → Thấy "AI is typing..." → Thấy từng chữ xuất hiện
2. Bật suggest mode → Gửi message → Kiểm tra response dài hơn (≤5000 tokens)

### Test token limits:
```bash
# Check logs for token limit
🎯 Token limit: 4000 (suggestions: false)
🎯 Token limit: 5000 (suggestions: true)
```

### Test error cases:
1. Disconnect network → AI should show error after timeout
2. Failed message → Retry button appears
3. Socket reconnect → Rejoin conversation

---

## 📝 Notes

- Message flow: **User send → Save → Broadcast → Create AI placeholder → Stream → Update → Emit end**
- AI message always created in database first (empty content)
- Frontend displays streaming with `isStreaming` flag
- Token limit applied at OpenAI API call level
- Suggestions add ~1000 tokens for follow-up questions

