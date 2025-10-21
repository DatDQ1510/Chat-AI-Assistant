# Bug Fix: "Loading older messages..." hiện khi gửi tin nhắn mới

## 🐛 Vấn đề
Mỗi khi gửi tin nhắn mới, loading indicator "Loading older messages..." xuất hiện không đúng lúc.

## 🔍 Nguyên nhân

### 1. Initial Load Set isLoading = true
Khi load messages lần đầu cho một conversation, code cũ set `isLoading: true`:

```typescript
// CŨ - SAI ❌
setMessagePagination(prev => ({
  ...prev,
  [conversationId]: {
    currentPage: 1,
    totalPages: 1,
    isLoading: true,  // ❌ Này khiến indicator hiện
    hasMore: true,
  }
}));
```

**Vấn đề**: `isLoadingMore` prop được pass vào MessageList dựa trên `messagePagination[id].isLoading`, nên indicator "Loading older messages..." sẽ hiện ngay cả khi là **initial load**, không phải load more.

### 2. Missing Pagination State cho Conversation mới
Khi tạo conversation mới (trong `handleSendMessage`), `messagePagination` state không được initialize, dẫn đến behavior không consistent.

## ✅ Giải pháp

### Fix 1: Không set isLoading cho Initial Load
```typescript
// MỚI - ĐÚNG ✅
// Don't set isLoading for initial load (only for pagination/load more)
// Initial pagination state will be set after successful fetch

const { messages, pagination } = await messageService.getMessagesByConversation(
  chatState.currentConversationId,
  { page: 1, limit: 20 }
);

// Update pagination state AFTER fetch
setMessagePagination(prev => ({
  ...prev,
  [chatState.currentConversationId!]: {
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    isLoading: false,  // ✅ Only false sau khi load xong
    hasMore: pagination.page < pagination.totalPages,
  }
}));
```

**Logic**:
- **Initial load**: KHÔNG set `isLoading: true` → Không hiện indicator
- **Load more** (pagination): Mới set `isLoading: true` → Hiện indicator đúng lúc

### Fix 2: Initialize Pagination State cho Conversation mới
```typescript
// Trong handleSendMessage khi tạo conversation mới
setChatState(prev => ({
  ...prev,
  conversations: [conv, ...prev.conversations],
  currentConversationId: conv.id,
}));

// ✅ Initialize pagination state cho conversation mới
setMessagePagination(prev => ({
  ...prev,
  [conv.id]: {
    currentPage: 1,
    totalPages: 1,
    isLoading: false,
    hasMore: false,
  }
}));
```

**Lý do**: Đảm bảo `messagePagination[conversationId]` luôn tồn tại, tránh undefined behavior.

## 📊 Behavior mong muốn

### Scenario 1: Load conversation lần đầu
1. User click vào conversation
2. useEffect trigger → load 20 messages đầu tiên
3. **KHÔNG hiện** "Loading older messages..."
4. Messages hiện ra bình thường

### Scenario 2: Gửi tin nhắn mới
1. User type message và send
2. Message hiện optimistically
3. **KHÔNG hiện** "Loading older messages..."
4. AI response stream vào

### Scenario 3: Scroll lên để load more
1. User scroll lên đầu (scrollTop < 100px)
2. Trigger `handleLoadMoreMessages()`
3. Set `isLoading: true`
4. **HIỆN** "Loading older messages..." ✅
5. Load 20 messages cũ hơn
6. Set `isLoading: false`
7. Indicator biến mất

### Scenario 4: Tạo conversation mới
1. User click "New Chat"
2. Conversation được tạo
3. `messagePagination` được initialize với `isLoading: false`
4. User gửi message đầu tiên
5. **KHÔNG hiện** "Loading older messages..."

## 🧪 Testing

### Test Case 1: Gửi message trong conversation rỗng
```
1. Tạo conversation mới
2. Gửi message đầu tiên
Expected: Không thấy "Loading older messages..."
```

### Test Case 2: Gửi message trong conversation có sẵn messages
```
1. Chọn conversation có messages
2. Gửi message mới
Expected: Không thấy "Loading older messages..."
```

### Test Case 3: Scroll để load more
```
1. Trong conversation có > 20 messages
2. Scroll lên đầu
Expected: Thấy "Loading older messages..." ở đầu danh sách
```

### Test Case 4: Load conversation lần đầu
```
1. Chọn conversation chưa load messages
2. Wait for messages load
Expected: Không thấy "Loading older messages..."
```

## 📝 Code Changes

### File: `Frontend/src/components/chat/ChatContainer.tsx`

#### Change 1: Remove isLoading from initial load
```diff
  try {
-   // Set loading state
-   setMessagePagination(prev => ({
-     ...prev,
-     [chatState.currentConversationId!]: {
-       currentPage: 1,
-       totalPages: 1,
-       isLoading: true,
-       hasMore: true,
-     }
-   }));

+   // Don't set isLoading for initial load (only for pagination/load more)
+   // Initial pagination state will be set after successful fetch
    
    const { messages, pagination } = await messageService.getMessagesByConversation(
      chatState.currentConversationId,
      { page: 1, limit: 20 }
    );
```

#### Change 2: Initialize pagination for new conversation
```diff
  setChatState(prev => ({
    ...prev,
    conversations: [conv, ...prev.conversations],
    currentConversationId: conv.id,
  }));

+ // Initialize pagination state for new conversation
+ setMessagePagination(prev => ({
+   ...prev,
+   [conv.id]: {
+     currentPage: 1,
+     totalPages: 1,
+     isLoading: false,
+     hasMore: false,
+   }
+ }));

  // ✅ join socket room
  socket.emit("join_conversation", conv.id);
```

## ✅ Kết quả

- ✅ "Loading older messages..." CHỈ hiện khi scroll lên để load more
- ✅ KHÔNG hiện khi gửi message mới
- ✅ KHÔNG hiện khi load conversation lần đầu
- ✅ KHÔNG hiện khi tạo conversation mới
- ✅ Pagination state được initialize đúng cách

## 📚 Liên quan

- `MessageList.tsx`: Component hiển thị indicator dựa trên prop `isLoadingMore`
- `ChatContainer.tsx`: Component quản lý `messagePagination` state
- `PAGINATION_GUIDE.md`: Documentation về pagination implementation

---

**Status**: ✅ Fixed
**Date**: October 14, 2025
