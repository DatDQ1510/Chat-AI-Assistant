# Pagination & Infinite Scroll Implementation Guide

## Overview
Đã implement pagination và infinite scroll cho cả messages và conversations. User có thể scroll để load thêm dữ liệu.

## Features Implemented

### ✅ 1. Message Pagination
- Load 20 messages đầu tiên khi mở conversation
- Tự động load thêm 20 messages cũ hơn khi scroll **lên đầu**
- Maintain scroll position sau khi load thêm messages
- Loading indicator khi đang fetch older messages

### ✅ 2. Conversation Pagination
- Load 20 conversations đầu tiên khi vào app
- Tự động load thêm 20 conversations khi scroll **xuống dưới** trong sidebar
- Loading indicator khi đang fetch more conversations
- Support cả desktop và mobile view

### ✅ 3. Smart Loading
- Chỉ load khi chưa có messages trong conversation
- Prevent duplicate loading (check isLoading state)
- Track pagination state cho từng conversation riêng biệt

### ✅ 3. Scroll Behavior
- Scroll chỉ trong message container (không ảnh hưởng sidebar)
- Auto scroll to bottom khi có message mới
- Maintain scroll position khi load older messages
- Smooth scrolling experience

## Technical Implementation

### State Management

```typescript
// ChatContainer.tsx
const [messagePagination, setMessagePagination] = useState<{
  [conversationId: string]: {
    currentPage: number;
    totalPages: number;
    isLoading: boolean;
    hasMore: boolean;
  };
}>({});
```

### Load Initial Messages

```typescript
// Load first 20 messages when conversation is selected
const { messages, pagination } = await messageService.getMessagesByConversation(
  conversationId,
  { page: 1, limit: 20 }
);
```

### Load More Messages (Infinite Scroll)

```typescript
const handleLoadMoreMessages = useCallback(async () => {
  if (!currentConversationId) return;
  
  const pagination = messagePagination[currentConversationId];
  if (!pagination || pagination.isLoading || !pagination.hasMore) return;

  const nextPage = pagination.currentPage + 1;
  
  // Fetch older messages
  const { messages: olderMessages } = await messageService.getMessagesByConversation(
    currentConversationId,
    { page: nextPage, limit: 20 }
  );

  // Prepend to existing messages
  setChatState(prev => ({
    ...prev,
    conversations: prev.conversations.map(c =>
      c.id === currentConversationId
        ? { ...c, messages: [...olderMessages, ...(c.messages || [])] }
        : c
    ),
  }));
}, [currentConversationId, messagePagination]);
```

### Scroll Detection

```typescript
// MessageList.tsx
useEffect(() => {
  const container = containerRef.current;
  if (!container || !onLoadMore) return;

  const handleScroll = () => {
    // Check if scrolled to top (within 100px threshold)
    if (container.scrollTop < 100 && hasMore && !isLoadingMore) {
      console.log('📜 Reached top, loading more messages...');
      // Save current scroll position
      previousScrollHeightRef.current = container.scrollHeight;
      onLoadMore();
    }
  };

  container.addEventListener('scroll', handleScroll);
  return () => container.removeEventListener('scroll', handleScroll);
}, [onLoadMore, hasMore, isLoadingMore]);
```

### Maintain Scroll Position

```typescript
// After loading older messages, adjust scroll to maintain position
useEffect(() => {
  const container = containerRef.current;
  if (!container || !isLoadingMore) return;

  if (previousScrollHeightRef.current) {
    const newScrollHeight = container.scrollHeight;
    const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
    container.scrollTop = scrollDiff; // Adjust scroll position
    previousScrollHeightRef.current = 0;
  }
}, [messages.length, isLoadingMore]);
```

## Props Flow

```typescript
// ChatContainer → MessageList
<MessageList
  messages={currentConversation?.messages || []}
  isLoading={isWaitingForAI}
  onCopyMessage={handleCopyMessage}
  onLoadMore={handleLoadMoreMessages}           // ✅ Callback to load more
  hasMore={messagePagination[conv.id]?.hasMore} // ✅ Has more pages?
  isLoadingMore={messagePagination[conv.id]?.isLoading} // ✅ Loading state
/>
```

## UI Components

### Loading Indicator at Top
```tsx
{isLoadingMore && (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
    <Spin size="small" />
    <span style={{ marginLeft: 8 }}>Loading older messages...</span>
  </div>
)}
```

### Message Container with Scroll
```tsx
<div 
  ref={containerRef}
  style={{ 
    height: '100%',
    overflowY: 'auto', // Enable scroll
    display: 'flex', 
    flexDirection: 'column', 
  }}
>
  {/* Load more indicator */}
  {/* Messages */}
  {/* Typing indicator */}
</div>
```

## Conversation Pagination

### State Management

```typescript
// ChatContainer.tsx
const [conversationPagination, setConversationPagination] = useState({
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  hasMore: false,
});
```

### Load Initial Conversations

```typescript
// Load first 20 conversations on app start
const loadConversations = async ({ page = 1, append = false }) => {
  const limit = 20;
  const response = await conversationService.getUserConversations({ page, limit });
  
  const conversations = response?.conversations ?? [];
  const total = response?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  setChatState(prev => ({
    ...prev,
    conversations: append 
      ? [...prev.conversations, ...conversations]  // Append for pagination
      : conversations,                              // Replace for initial load
  }));

  setConversationPagination({
    currentPage: page,
    totalPages,
    isLoading: false,
    hasMore: page < totalPages,
  });
};
```

### Load More Conversations (Scroll Down)

```typescript
const handleLoadMoreConversations = useCallback(async () => {
  if (conversationPagination.isLoading || !conversationPagination.hasMore) return;

  const nextPage = conversationPagination.currentPage + 1;
  await loadConversations({ page: nextPage, append: true, manageLoading: false });
}, [conversationPagination, loadConversations]);
```

### Scroll Detection in Sidebar

```typescript
// ChatSidebar.tsx
useEffect(() => {
  const listElement = listRef.current;
  if (!listElement || !onLoadMore || !hasMore || isLoadingMore) return;

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = listElement;
    const scrollThreshold = 100; // pixels from bottom
    
    // Check if scrolled near bottom
    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      onLoadMore();
    }
  };

  listElement.addEventListener('scroll', handleScroll);
  return () => listElement.removeEventListener('scroll', handleScroll);
}, [onLoadMore, hasMore, isLoadingMore]);
```

### Props Flow

```typescript
// ChatContainer → ChatSidebar
<ChatSidebar
  conversations={chatState.conversations}
  onLoadMore={handleLoadMoreConversations}              // ✅ Callback to load more
  hasMore={conversationPagination.hasMore}              // ✅ Has more pages?
  isLoadingMore={conversationPagination.isLoading}      // ✅ Loading state
  // ... other props
/>
```

### Loading Indicator at Bottom

```tsx
// ChatSidebar.tsx
{isLoadingMore && (
  <div style={{ textAlign: 'center', padding: '16px 0' }}>
    <Spin size="small" />
  </div>
)}
```

## Backend API Support

Backend already supports pagination for both messages and conversations:

### Messages API
```typescript
GET /v1/api/messages/:conversation_id?page=1&limit=20

Response:
{
  "success": true,
  "data": {
    "count": 150,
    "rows": [...messages]
  }
}
```

Frontend maps this to:
```typescript
{
  messages: Message[],
  pagination: {
    total: 150,
    page: 1,
    totalPages: 8,
    limit: 20
  }
}
```

### Conversations API
```typescript
GET /v1/api/conversations?page=1&limit=20

Response:
{
  "success": true,
  "data": {
    "conversations": [...conversations],
    "pagination": {
      "total": 50,
      "page": 1,
      "totalPages": 3,
      "limit": 20
    }
  }
}
```

## Testing Checklist

### Message Pagination
- [ ] Open conversation → Loads first 20 messages
- [ ] Scroll to top → Loads next 20 older messages
- [ ] Scroll position maintained after loading
- [ ] Loading indicator shows at top while fetching
- [ ] Stops loading when all messages loaded (hasMore = false)

### Conversation Pagination
- [ ] Open app → Loads first 20 conversations
- [ ] Scroll sidebar down → Loads next 20 conversations
- [ ] Loading indicator shows at bottom while fetching
- [ ] Stops loading when all conversations loaded (hasMore = false)
- [ ] Works on both desktop and mobile (drawer)

### Scroll Behavior
- [ ] New message → Auto scrolls to bottom
- [ ] Load older messages → Scroll stays at same message
- [ ] Sidebar scroll independent from message scroll
- [ ] Smooth scrolling experience
- [ ] Scroll down in sidebar triggers conversation pagination

### Edge Cases
- [ ] Empty conversation → Shows empty state
- [ ] Only 5 messages → No pagination needed
- [ ] Only 10 conversations → No pagination needed
- [ ] Network error → Shows error, doesn't break
- [ ] Fast scrolling → Prevents duplicate requests
- [ ] Search conversations → Filters client-side only (pagination disabled during search)

## Performance Considerations

### ✅ Implemented
- Lazy loading (only load when needed)
- Pagination (20 items per page for both messages and conversations)
- Prevent duplicate requests (check isLoading)
- Efficient scroll detection (simple threshold check)
- Scroll isolation (each component has its own scroll container)
- Smart state management (track pagination per conversation for messages)

### 🔄 Future Optimizations
- Virtual scrolling for very long conversations (react-window)
- Image lazy loading in messages
- Debounce scroll event (if performance issues arise)
- Cache messages/conversations in localStorage for offline access
- Server-side search for conversations (currently client-side only)

## Summary

✅ **Message Pagination**: Complete - Scroll up to load older messages  
✅ **Conversation Pagination**: Complete - Scroll down in sidebar to load more  
✅ **Scroll Isolation**: Messages and sidebar scroll independently  
✅ **UX**: Smooth loading with indicators at appropriate positions  
✅ **UI Simplification**: Removed ChatNavRail, using only ChatSidebar for all screens

### Architecture Changes
- **Removed**: ChatSidebarRail component (desktop nav rail)
- **Unified**: Single ChatSidebar component for both desktop and mobile
- **Desktop**: Menu button in header opens sidebar drawer
- **Mobile**: Same sidebar in drawer mode

Hệ thống đã sẵn sàng cho việc handle large datasets với hàng trăm conversations và messages!
