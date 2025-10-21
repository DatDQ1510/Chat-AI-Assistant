# Pagination Testing Plan

## ✅ Những gì đã implement

### 1. **Message Pagination** 
- Load 20 messages đầu tiên khi mở conversation
- Scroll lên đầu (< 100px from top) → tự động load thêm 20 messages cũ hơn
- Maintain scroll position sau khi load (không nhảy về đầu)
- Loading indicator ở đầu danh sách khi đang fetch
- Stop loading khi hết messages (hasMore = false)

### 2. **Conversation Pagination**
- Load 20 conversations đầu tiên khi vào app
- Scroll xuống dưới sidebar (< 100px from bottom) → tự động load thêm 20 conversations
- Loading indicator ở cuối danh sách khi đang fetch
- Stop loading khi hết conversations (hasMore = false)

### 3. **UI Simplification**
- ❌ Removed: `ChatSidebarRail` (desktop nav rail) 
- ✅ Unified: Chỉ dùng `ChatSidebar` cho cả desktop và mobile
- Desktop: Menu button in header → opens sidebar drawer
- Mobile: Same sidebar in drawer mode

## 🧪 Test Cases

### A. Message Pagination

#### Test 1: Initial Load
1. Login vào app
2. Chọn một conversation có > 20 messages
3. **Expected**: Chỉ load 20 messages mới nhất
4. **Check**: Network tab → `GET /api/messages/:id?page=1&limit=20`

#### Test 2: Load More Messages
1. Trong conversation có > 20 messages
2. Scroll lên đầu (đến message cũ nhất)
3. **Expected**: 
   - Thấy loading spinner ở đầu
   - Load thêm 20 messages cũ hơn
   - Scroll position giữ nguyên (không nhảy)
4. **Check**: Network tab → `GET /api/messages/:id?page=2&limit=20`

#### Test 3: Stop Loading
1. Trong conversation có đúng 35 messages
2. Load page 1 (20 messages)
3. Scroll lên → load page 2 (15 messages)
4. Scroll lên nữa
5. **Expected**: Không load thêm (đã hết messages)

#### Test 4: New Message
1. Đang ở cuối conversation
2. Send message mới hoặc nhận message từ AI
3. **Expected**: Auto scroll to bottom, show new message

### B. Conversation Pagination

#### Test 5: Initial Load
1. Login vào app (có > 20 conversations)
2. **Expected**: Chỉ load 20 conversations đầu
3. **Check**: Network tab → `GET /api/conversations?page=1&limit=20`

#### Test 6: Load More Conversations
1. Mở sidebar (click menu button)
2. Scroll xuống dưới trong sidebar
3. **Expected**:
   - Thấy loading spinner ở cuối
   - Load thêm 20 conversations
4. **Check**: Network tab → `GET /api/conversations?page=2&limit=20`

#### Test 7: Create New Conversation
1. Click "New Chat" button
2. **Expected**:
   - Tạo conversation mới
   - **Reload lại page 1** của conversations (để sync với server)
   - New conversation xuất hiện ở đầu danh sách
   - Auto select conversation mới
3. **Check**: Pagination reset về page 1

#### Test 8: Delete Conversation
1. Delete một conversation
2. **Expected**:
   - Conversation bị xóa
   - **Reload lại page 1** của conversations
   - Nếu đang select conversation đó → auto select conversation khác
3. **Check**: Pagination reset về page 1

### C. Scroll Isolation

#### Test 9: Independent Scrolling
1. Mở sidebar (có nhiều conversations)
2. Mở conversation (có nhiều messages)
3. Scroll messages lên/xuống
4. **Expected**: Sidebar không scroll
5. Scroll sidebar lên/xuống
6. **Expected**: Messages không scroll

### D. Edge Cases

#### Test 10: Empty Conversation
1. Tạo conversation mới (chưa có message)
2. **Expected**: Hiện empty state "No messages yet"

#### Test 11: Few Messages
1. Conversation chỉ có 5 messages
2. **Expected**: Load 5 messages, không có loading indicator, hasMore = false

#### Test 12: Network Error
1. Disconnect network
2. Scroll để trigger load more
3. **Expected**: 
   - Error message hiện
   - App không crash
   - Có thể retry khi network trở lại

#### Test 13: Fast Scrolling
1. Scroll nhanh lên/xuống nhiều lần
2. **Expected**: 
   - Chỉ trigger 1 request (check isLoading)
   - Không load duplicate

#### Test 14: Search + Pagination
1. Load 20 conversations
2. Search "test"
3. **Expected**: 
   - Filter conversations client-side
   - Pagination bị disabled khi search (hiện tại)
   - TODO: Server-side search with pagination

## 📊 Performance Metrics

### Expected Behavior:
- **Initial page load**: Load 20 conversations + 0 messages (chọn conversation sau)
- **Select conversation**: Load 20 messages cho conversation đó
- **Scroll to load more**: +20 items mỗi lần
- **Memory**: Không tăng vô hạn (older messages/conversations được giữ in memory)

### Optimization Ideas (Future):
- Virtual scrolling cho conversations/messages rất dài
- Cache messages in localStorage
- Lazy load images
- Server-side search

## 🐛 Known Issues / Limitations

### 1. Search Functionality
- **Current**: Client-side filter (chỉ search trong conversations đã load)
- **Issue**: Nếu search "abc" nhưng conversation "abc" ở page 3 → không tìm thấy
- **Solution**: Implement server-side search API

### 2. Rename Conversation
- **Current**: Update local state only
- **Issue**: Nếu reload page → title sync từ server
- **Status**: OK (minor issue)

### 3. Memory Management
- **Current**: Giữ tất cả messages đã load in memory
- **Issue**: Conversation có 1000+ messages → memory tăng cao
- **Solution**: Implement virtual scrolling hoặc unload older messages

## 🚀 How to Test

### Option 1: Manual Testing
```bash
# Terminal 1: Start Backend
cd Backend
npm run dev

# Terminal 2: Start Frontend
cd Frontend
npm run dev
```

### Option 2: Create Test Data
```bash
# Run script to create many conversations and messages
node Backend/scripts/seed-test-data.js
```

### Option 3: Use Postman/API Client
- Import collection từ `docs/`
- Test pagination endpoints directly

## ✅ Acceptance Criteria

- [ ] Messages load 20 at a time
- [ ] Conversations load 20 at a time
- [ ] Scroll up in messages → load older messages
- [ ] Scroll down in sidebar → load more conversations
- [ ] Loading indicators show appropriately
- [ ] No duplicate requests
- [ ] Scroll position maintained
- [ ] New/delete conversation reloads page 1
- [ ] No console errors
- [ ] Smooth UX (no janky scrolling)

## 📝 Notes

- Backend API đã support pagination đầy đủ
- Frontend service layer đã có PaginationParams
- Pagination state được manage riêng cho messages (per conversation) và conversations (global)
- ChatNavRail đã bị remove để simplify UI

---

**Status**: ✅ Implementation Complete, Ready for Testing
**Date**: October 14, 2025
