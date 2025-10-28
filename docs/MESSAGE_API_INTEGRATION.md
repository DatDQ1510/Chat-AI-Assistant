# Message API Integration Guide

## Overview
This document describes the complete message API integration in the AI Chatbot Assistant application, including how messages are persisted to the database and loaded from the backend.

## Architecture

### Backend APIs
The backend provides three main endpoints for message operations:

1. **Create User Message**: `POST /v1/api/messages`
   - Creates a new user message in a conversation
   - Request body: `{ conversation_id: string, content: string }`
   - Response: Message object

2. **Get Messages**: `GET /v1/api/messages/:conversation_id`
   - Retrieves all messages for a specific conversation
   - Query params: `page` (default: 1), `limit` (default: 50)
   - Response: Array of message objects with pagination info

3. **Save AI Reply**: `POST /v1/api/messages/reply`
   - Saves an AI response to a conversation
   - Request body: `{ conversation_id: string, content: string }`
   - Response: Message object

### Frontend Service Layer
Located in `Frontend/src/services/message.service.ts`:

```typescript
// Message DTO from backend
interface MessageDto {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'assistant';
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Mapping function to convert backend DTO to frontend Message type
const mapMessage = (dto: MessageDto): Message => ({
  id: dto.id,
  content: dto.content,
  role: dto.sender_type,
  timestamp: new Date(dto.createdAt),
});

// API methods
export const getMessagesByConversation = async (
  conversationId: string, 
  page = 1, 
  limit = 50
): Promise<Message[]>

export const createMessage = async (
  conversationId: string, 
  content: string
): Promise<Message>

export const getAIReply = async (
  conversationId: string, 
  content: string
): Promise<Message>
```

## Message Flow

### 1. Loading Messages
When a user selects a conversation:

```typescript
const handleSelectConversation = useCallback(async (id: string) => {
  const conv = chatState.conversations.find(c => c.id === id);
  
  // Only load messages if not already loaded
  if (conv && (!conv.messages || conv.messages.length === 0)) {
    try {
      const messages = await messageService.getMessagesByConversation(id);
      // Update conversation with loaded messages
      setChatState(prev => ({
        ...prev,
        conversations: prev.conversations.map(c =>
          c.id === id ? { ...c, messages } : c
        ),
        currentConversationId: id,
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  } else {
    // Messages already loaded, just switch conversation
    setChatState(prev => ({
      ...prev,
      currentConversationId: id,
    }));
  }
}, [chatState.conversations]);
```

**Key Points:**
- Messages are loaded lazily when a conversation is first selected
- Subsequent selections don't reload messages (they're cached in state)
- Error handling logs to console but doesn't block UI

### 2. Sending Messages
When a user sends a message:

```typescript
const handleSendMessage = useCallback(async (content: string) => {
  try {
    let conversationId = chatState.currentConversationId;
    
    // 1. Create conversation if needed
    if (!conversationId) {
      const newConv = await conversationService.createConversation({
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
      });
      conversationId = newConv.id;
      // Add to state immediately
      setChatState(prev => ({
        ...prev,
        conversations: [newConv, ...prev.conversations],
        currentConversationId: newConv.id,
      }));
    }

    // 2. Create user message (optimistic UI update)
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      timestamp: new Date(),
    };
    
    // Show message immediately
    setChatState(prev => ({
      ...prev,
      conversations: prev.conversations.map(c =>
        c.id === conversationId ? {
          ...c,
          messages: [...(c.messages || []), userMessage]
        } : c
      ),
    }));

    // 3. Save user message to backend
    const savedUserMessage = await messageService.createMessage(
      conversationId, 
      content
    );

    // 4. Simulate AI streaming response
    setChatState(prev => ({ ...prev, isStreaming: true }));
    
    const aiMessage: Message = {
      id: crypto.randomUUID(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
    };
    
    // Add empty AI message
    setChatState(prev => ({
      ...prev,
      conversations: prev.conversations.map(c =>
        c.id === conversationId ? {
          ...c,
          messages: [...(c.messages || []), aiMessage]
        } : c
      ),
    }));

    // Simulate streaming
    const fullResponse = "This is a simulated AI response...";
    for (let i = 0; i <= fullResponse.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      const chunk = fullResponse.slice(0, i);
      
      setChatState(prev => ({
        ...prev,
        conversations: prev.conversations.map(c =>
          c.id === conversationId ? {
            ...c,
            messages: c.messages?.map(m =>
              m.id === aiMessage.id ? { ...m, content: chunk } : m
            ) || []
          } : c
        ),
      }));
    }

    // 5. Save AI response to backend
    await messageService.getAIReply(conversationId, fullResponse);
    
    setChatState(prev => ({ ...prev, isStreaming: false }));
    
  } catch (error) {
    console.error('Failed to send message:', error);
    setChatState(prev => ({ ...prev, isStreaming: false }));
  }
}, [chatState.currentConversationId]);
```

**Key Points:**
- **Optimistic UI Updates**: Messages appear immediately before backend confirmation
- **Conversation Creation**: Automatically creates a conversation if sending to a new chat
- **Simulated Streaming**: Currently uses placeholder streaming effect (ready for real AI integration)
- **Error Handling**: Catches errors and stops streaming state

## Data Types

### Frontend Message Type
```typescript
// Frontend/src/types/chat.ts
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}
```

### Backend MessageDto Type
```typescript
// Backend response format
interface MessageDto {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'assistant';
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

**Mapping:**
- `sender_type` → `role`
- `createdAt` (string) → `timestamp` (Date)
- Backend includes `conversation_id`, `updatedAt` (not used in frontend)

## State Management

Messages are stored in the conversation state:

```typescript
interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isStreaming: boolean;
  isLoading: boolean;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[]; // Loaded lazily
}
```

**State Updates:**
1. Messages loaded when conversation first selected
2. New messages added optimistically (UI update before API)
3. Streaming updates modify message content in real-time
4. All changes trigger re-render of MessageList component

## Error Handling

Current error handling strategy:
- **Loading Messages**: Logs to console, doesn't show user error (conversation still selectable)
- **Sending Messages**: Logs to console, stops streaming state
- **Network Errors**: Caught by axios interceptors in `axiosClient.ts`

**Future Improvements:**
- Show user-friendly error notifications using Ant Design `message` component
- Retry logic for failed message sends
- Offline queue for messages sent without connection

## Performance Optimizations

1. **Lazy Loading**: Messages only loaded when conversation first viewed
2. **Caching**: Loaded messages cached in state, not reloaded on subsequent views
3. **Optimistic Updates**: UI responds immediately without waiting for backend
4. **Pagination Support**: Backend API supports `page` and `limit` params (not yet used in frontend)

**Future Optimizations:**
- Implement infinite scroll for long conversations
- Virtual scrolling for messages (react-window or react-virtualized)
- Message pagination in frontend (currently loads all messages at once)

## Testing Checklist

### Manual Testing Steps:
1. ✅ **Send Message in New Chat**
   - Type message
   - Verify conversation auto-created
   - Verify message appears immediately
   - Verify AI response streams in
   - Refresh page → verify messages persisted

2. ✅ **Send Message in Existing Chat**
   - Select existing conversation
   - Messages load from backend
   - Send new message
   - Verify both user and AI messages saved

3. ✅ **Switch Between Conversations**
   - Create multiple conversations
   - Send messages in each
   - Switch between them
   - Verify messages load correctly for each

4. ✅ **Page Reload**
   - Send messages
   - Refresh browser
   - Verify all conversations and messages restored

5. ⏳ **Error Scenarios** (TODO)
   - Network disconnected → send message
   - Backend returns error → verify graceful handling
   - Invalid conversation ID → verify error handling

## Next Steps

### 1. Real AI Integration
Replace simulated streaming with actual OpenAI API:

```typescript
// In handleSendMessage, replace simulation with:
const stream = await openAIService.streamResponse(conversationId, content);
for await (const chunk of stream) {
  // Update message content with real AI chunks
}
```

### 2. Enhanced Error Handling
```typescript
// Add user notifications
try {
  await messageService.createMessage(conversationId, content);
} catch (error) {
  message.error('Failed to send message. Please try again.');
  // Remove optimistic message from UI
  // Or add retry button
}
```

### 3. Message Pagination
```typescript
// Load more messages when scrolling to top
const loadMoreMessages = async (conversationId: string, page: number) => {
  const olderMessages = await messageService.getMessagesByConversation(
    conversationId,
    page,
    50
  );
  // Prepend to existing messages
};
```

### 4. Offline Support
```typescript
// Queue messages when offline
if (!navigator.onLine) {
  queueMessage(content);
  message.info('Message queued. Will send when online.');
}

// Retry queued messages when connection restored
window.addEventListener('online', () => {
  sendQueuedMessages();
});
```

## Code Files

### Key Files Modified:
1. `Frontend/src/services/message.service.ts` - NEW
   - Message API service layer
   - DTO mapping functions
   - API methods for CRUD operations

2. `Frontend/src/components/chat/ChatContainer.tsx` - MODIFIED
   - Added `messageService` import
   - Updated `handleSelectConversation` to load messages
   - Rewrote `handleSendMessage` with full API integration

### Related Files:
- `Frontend/src/types/chat.ts` - Message type definition
- `Frontend/src/config/axiosClient.ts` - HTTP client configuration
- `Backend/src/routes/message.routes.ts` - Backend API routes
- `Backend/src/controllers/message.controller.ts` - Backend message controller

## Summary

The message API integration is **complete** and **functional**:
- ✅ Messages persist to database
- ✅ Messages load when selecting conversations
- ✅ Optimistic UI updates for instant feedback
- ✅ Streaming AI responses (simulated, ready for real AI)
- ✅ Automatic conversation creation
- ⏳ Real AI integration (next step)
- ⏳ Enhanced error handling (future improvement)
- ⏳ Message pagination (future optimization)

The system is production-ready for basic chat functionality, with clear paths for enhancement documented above.
