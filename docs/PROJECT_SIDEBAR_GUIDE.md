# Project Sidebar - Implementation Guide

## 📁 Tổng quan

Component **ProjectSidebar** cho phép người dùng tổ chức conversations thành các projects, giống như ChatGPT. Component này đã được tích hợp đầy đủ vào sidebar chính.

## 🎯 Tính năng

### 1. **Collapse/Expand**
- Click vào header "Projects" để thu gọn/mở rộng
- Icon arrow thay đổi (→ / ↓) theo trạng thái
- Animation mượt mà khi expand/collapse

### 2. **Project Management**
- ✅ **Create**: Click "New Project" → Modal nhập tên + mô tả
- ✅ **Rename**: Click menu (⋯) → Rename → Inline editing
- ✅ **Delete**: Click menu (⋯) → Delete → Confirmation modal
- ✅ **Expand/Collapse**: Click vào project để xem conversations

### 3. **Conversation Display**
- Mỗi project khi expand sẽ load conversations từ API
- Conversations hiển thị dạng list indent bên trong project
- Highlight conversation đang active
- Click conversation → Navigate đến chat đó

### 4. **Empty States**
- "No projects yet" khi chưa có project nào
- "No conversations yet" khi project không có conversation

## 📂 Cấu trúc Files

```
Frontend/src/
├── components/chat/
│   ├── ProjectSidebar.tsx        # Main sidebar component
│   ├── ProjectItem.tsx           # Individual project with nested conversations
│   └── ChatSidebar.tsx           # Updated to include ProjectSidebar
├── hooks/
│   └── useProjects.ts            # Project state management
├── services/
│   └── project.service.ts        # API calls
└── types/
    └── chat.ts                   # Project & ProjectItemProps types
```

## 🔌 API Integration

Component sử dụng các endpoint sau:

### **GET /v1/api/projects**
Lấy tất cả projects của user
```typescript
Response: {
  data: Project[]
}
```

### **POST /v1/api/projects**
Tạo project mới
```typescript
Request: {
  project_name: string,
  description?: string
}
Response: {
  data: Project
}
```

### **PATCH /v1/api/projects/:id**
Cập nhật project
```typescript
Request: {
  project_name: string,
  description?: string
}
```

### **DELETE /v1/api/projects/:id**
Xóa project

### **GET /v1/api/projects/:id/conversations**
Lấy conversations của project
```typescript
Response: {
  data: Conversation[]
}
```

## 🚀 Cách sử dụng

### 1. Component đã được tích hợp vào ChatSidebar

```tsx
// ChatSidebar.tsx
import ProjectSidebar from './ProjectSidebar';

// Đặt ngay sau Search button, trước Divider
<ProjectSidebar currentConversationId={currentConversationId} />
```

### 2. Sử dụng độc lập (nếu cần)

```tsx
import ProjectSidebar from './components/chat/ProjectSidebar';

function App() {
  return (
    <ProjectSidebar currentConversationId={currentChatId} />
  );
}
```

## 🎨 UI/UX Features

### **Visual Design**
- ✅ Folder icon màu vàng (#faad14) cho projects
- ✅ Message icon cho conversations
- ✅ Badge hiển thị số lượng projects/conversations
- ✅ Highlight màu xanh (#e6f4ff) cho active conversation
- ✅ Hover effects mượt mà

### **Animations**
```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### **Tooltips**
- Tên project/conversation dài → Ellipsis + tooltip hiện full text
- Tooltip placement: `right` để không bị che bởi sidebar

## 🔧 State Management

### **useProjects Hook**

```typescript
const {
  projects,              // Project[]
  loading,              // boolean
  expandedProjects,     // Set<string>
  fetchProjects,        // () => Promise<void>
  createProject,        // (name, desc?) => Promise<void>
  deleteProject,        // (id) => Promise<void>
  updateProject,        // (id, name, desc?) => Promise<void>
  toggleProject,        // (id) => Promise<void>
} = useProjects();
```

### **Local State trong ProjectSidebar**
- `isExpanded`: Sidebar thu gọn/mở rộng
- `isCreateModalVisible`: Modal tạo project
- `newProjectName`: Tên project mới
- `newProjectDescription`: Mô tả project mới
- `creating`: Loading state khi tạo project

## 📝 Type Definitions

```typescript
interface Project {
  id: string;
  project_name: string;
  description?: string;
  user_id: string;
  createdAt: Date;
  updatedAt: Date;
  conversations?: Conversation[];
}

interface ProjectItemProps {
  project: Project;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onConversationClick?: (conversationId: string) => void;
  currentConversationId?: string | null;
}
```

## 🎯 User Flow

### **Tạo Project**
1. Click "Projects" để expand sidebar
2. Click "New Project" button
3. Modal hiện ra → Nhập tên + mô tả
4. Click "Create" → API call → Project mới xuất hiện đầu danh sách

### **Xem Conversations trong Project**
1. Click vào project name hoặc arrow icon
2. Loading spinner hiện (nếu chưa fetch)
3. API fetch conversations
4. Conversations hiển thị dạng nested list
5. Click conversation → Navigate đến chat

### **Rename Project**
1. Click menu (⋯) bên cạnh project
2. Select "Rename"
3. Input field hiện → Nhập tên mới
4. Press Enter hoặc blur → API update

### **Delete Project**
1. Click menu (⋯) → "Delete"
2. Confirmation modal: "All conversations will be unlinked"
3. Confirm → API delete → Project biến mất

## ⚡ Performance Optimizations

### **Lazy Loading**
- Projects chỉ fetch khi sidebar expand lần đầu
- Conversations chỉ fetch khi project expand
- Dùng Set cho expandedProjects (O(1) lookup)

### **Memoization**
- useCallback cho tất cả handlers
- Prevent unnecessary re-renders

### **Conditional Rendering**
- Chỉ render conversations khi project expanded
- Loading states riêng cho từng project

## 🐛 Error Handling

```typescript
try {
  await projectService.createProject(name, desc);
  message.success('Project created');
} catch (error) {
  console.error('Failed:', error);
  message.error('Failed to create project');
}
```

- Tất cả API calls đều có try-catch
- User-friendly error messages với Ant Design message
- Console logs cho debugging

## 🔮 Future Enhancements

### Có thể thêm:
1. **Drag & Drop**: Kéo conversation vào project
2. **Project Colors**: Custom màu sắc cho project
3. **Project Search**: Tìm kiếm trong projects
4. **Shared Projects**: Chia sẻ project với team
5. **Project Templates**: Templates cho các use-case phổ biến
6. **Project Stats**: Số lượng messages, tokens used, etc.

## 📌 Notes

- Component hoàn toàn độc lập, có thể tái sử dụng
- Tương thích với theme Ant Design
- Responsive design (scroll khi nhiều projects)
- Accessibility: keyboard navigation, ARIA labels
- TypeScript strict mode compatible

## 🎉 Kết luận

ProjectSidebar đã sẵn sàng sử dụng! Chỉ cần:
1. ✅ Backend API đã implement đầy đủ
2. ✅ Frontend components hoàn chỉnh
3. ✅ Đã tích hợp vào ChatSidebar
4. ✅ Zero errors, ready to run

Restart dev server và test ngay! 🚀
