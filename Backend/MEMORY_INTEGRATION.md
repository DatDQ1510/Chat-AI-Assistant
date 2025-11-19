# Memory Integration - Tích hợp AI nhớ thông tin cá nhân

## 🎯 Mục tiêu
AI assistant có khả năng:
1. **Nhớ** thông tin cá nhân từ cuộc trò chuyện
2. **Trích xuất** facts từ user messages
3. **Tìm kiếm** memories liên quan bằng semantic search
4. **Sử dụng** memories để trả lời câu hỏi cá nhân chính xác

## 📂 Files đã tạo/sửa

### 1. **memory.service.ts** (NEW)
Service chính cho memory operations:

```typescript
// Tìm kiếm memories liên quan
searchRelevantMemories(userId, query, limit, minSimilarity)

// Kiểm tra xem query có liên quan đến thông tin cá nhân không
isPersonalQuery(query)

// Format memories thành text để thêm vào prompt
formatMemoriesForPrompt(memories)
```

**Features:**
- ✅ Semantic search với cosine similarity
- ✅ Threshold filtering (default 0.6 = 60%)
- ✅ Smart personal query detection
- ✅ Formatted output for AI prompt

### 2. **context.service.ts** (UPDATED)
Tích hợp memory vào AI context:

```typescript
async buildPrompt(conversationId, userMessage, userId, text_file_urls) {
  // ... existing code ...
  
  // ✅ NEW: Check if query is personal
  if (userId && memoryService.isPersonalQuery(userMessage)) {
    const relevantMemories = await memoryService.searchRelevantMemories(
      userId, userMessage, 5, 0.6
    );
    memoryContext = memoryService.formatMemoriesForPrompt(relevantMemories);
  }
  
  // ✅ Add memory to system prompt and user prompt
  const systemPrompt = `${baseInstruction}${memoryInstruction}`;
  const userPrompt = `${history}${memoryContext}\n ${userMessage}`;
}
```

### 3. **chat.socket.ts** (UPDATED)
Extract memories từ user messages:

```typescript
// STEP 1.5: Process user message for memory extraction
if (user_id && content.trim()) {
  processUserMessage(user_id, content).catch((err) => {
    console.error("Error processing memories:", err);
  });
}
```

**Note:** Chạy trong background (không await) để không block AI response.

## 🔄 Luồng hoạt động

### **Flow 1: Extract & Save Memories**
```
User sends message: "Tôi thích pizza và ăn chay"
   ↓
1. Save message to DB
   ↓
2. processUserMessage() extract facts:
   - "Tôi thích pizza"
   - "ăn chay"
   ↓
3. Create memory records (embedding = null)
   ↓
4. Add to memory queue (BullMQ)
   ↓
5. Worker generates embeddings async
   ↓
6. Update memories with embeddings
```

### **Flow 2: Retrieve & Use Memories**
```
User asks: "Tôi thích món ăn gì?"
   ↓
1. isPersonalQuery("Tôi thích món ăn gì?") → TRUE
   ↓
2. Generate embedding for query
   ↓
3. Search memories with cosine similarity
   ↓
4. Filter by threshold (>= 0.6)
   ↓
5. Format top 5 memories:
   Memory 1 (87.3%): Tôi thích pizza
   Memory 2 (72.1%): ăn chay
   ↓
6. Add to AI prompt:
   System: "IMPORTANT: Use these facts about user..."
   User: "... Memory 1: ..., Memory 2: ... \n Question: Tôi thích món ăn gì?"
   ↓
7. AI responds: "Bạn thích pizza và ăn chay"
```

## 🧪 Test Cases

### Test 1: Extract memories from conversation
```
User: "Mình tên là Đạt, đang làm việc tại FPT Software"

Expected:
✅ 2 memories created:
  - "Mình tên là Đạt"
  - "đang làm việc tại FPT Software"
✅ Embeddings generated in background
```

### Test 2: Answer personal questions
```
User: "Tên tôi là gì?"

Expected flow:
1. isPersonalQuery("Tên tôi là gì?") → TRUE
2. Search memories → Found: "Mình tên là Đạt" (similarity: 0.89)
3. Add to prompt:
   Memory 1 (89%): Mình tên là Đạt
4. AI responds: "Tên của bạn là Đạt"
```

### Test 3: Answer non-personal questions
```
User: "Thời tiết hôm nay thế nào?"

Expected flow:
1. isPersonalQuery("Thời tiết hôm nay thế nào?") → FALSE
2. Skip memory search
3. AI responds normally without memories
```

### Test 4: Multiple relevant memories
```
User said before:
- "Tôi thích pizza"
- "Tôi ăn chay"
- "Tôi sống ở Hà Nội"

User asks: "Sở thích ăn uống của tôi là gì?"

Expected:
1. Search memories
2. Found 2 relevant:
   - "Tôi thích pizza" (similarity: 0.87)
   - "Tôi ăn chay" (similarity: 0.83)
3. AI responds: "Bạn thích pizza và ăn chay"
```

## 🎛️ Configuration

### Similarity Threshold
```typescript
// In context.service.ts
const relevantMemories = await memoryService.searchRelevantMemories(
  userId,
  userMessage,
  5,      // Top 5 memories
  0.6     // 60% similarity minimum
);
```

**Tuning:**
- `0.5-0.6`: Relaxed (more memories, some may be less relevant)
- `0.7-0.8`: Balanced (good relevance)
- `0.9+`: Strict (only very similar memories)

### Personal Query Keywords
```typescript
// In memory.service.ts
const personalKeywords = [
  'tôi', 'mình', 'của tôi', 'sở thích', 'thích gì',
  'my', 'me', 'i like', 'about me', 'remember me',
  // Add more as needed
];
```

## 📊 Performance

### Token Budget
- Memories add ~50-200 tokens per query
- Factored into `MAX_CONTEXT_TOKENS` (3000)
- Truncation ensures total stays within budget

### Latency
- Memory search: ~50-100ms (in-memory cosine similarity)
- Embedding generation: ~200-500ms (async, background)
- Total impact: Minimal (<100ms added to response time)

### Scalability
- Embeddings: 1536 dimensions (text-embedding-3-small)
- Storage: ~6KB per memory (embedding + metadata)
- Performance: O(n) search (n = user's memories, typically <100)

## 🔍 Debugging

### Enable logs
```typescript
// In context.service.ts
console.log("🧠 Query is personal, searching memories...");
console.log(`✅ Found ${relevantMemories.length} relevant memories`);

// In memory.service.ts
console.log(`🧠 Found ${relevantMemories.length} relevant memories (similarity >= ${minSimilarity})`);
```

### Check memories in DB
```sql
SELECT * FROM user_memories WHERE user_id = '<user_id>' ORDER BY "createdAt" DESC;
```

### Inspect embeddings
```sql
SELECT 
  id, 
  content, 
  CASE WHEN embedding IS NULL THEN 'pending' ELSE 'generated' END as status
FROM user_memories 
WHERE user_id = '<user_id>';
```

## ⚠️ Edge Cases

### 1. No memories found
```typescript
if (relevantMemories.length === 0) {
  // AI responds: "Tôi không biết rõ về bạn, hãy chia sẻ thêm"
}
```

### 2. Low similarity scores
```typescript
// All memories < 0.6 threshold
// memoryContext = "" (empty)
// AI responds without memories
```

### 3. Embedding generation fails
```typescript
// Worker catches error, memory stays with embedding = null
// Won't be included in future searches until embedding generated
```

## 🚀 Future Enhancements

1. **Memory importance scoring**: Weight memories by importance (1-10)
2. **Memory expiration**: Auto-delete old/irrelevant memories
3. **Memory updates**: Detect conflicts and update (e.g., "Tôi đã chuyển sang sống ở TP.HCM")
4. **Memory categories**: Tag memories (preferences, facts, events)
5. **Vector DB**: Use Pinecone/Weaviate for large-scale memory search

## ✅ Validation Checklist

- [x] Memory service created with semantic search
- [x] Context service integrated with memory retrieval
- [x] Chat socket extracts memories from user messages
- [x] Personal query detection works
- [x] Memories formatted correctly in prompt
- [x] Background processing doesn't block responses
- [x] Similarity threshold configurable
- [x] Error handling in place
- [x] Logs for debugging

---

**Status**: ✅ Ready for testing
**Last Updated**: November 8, 2025
