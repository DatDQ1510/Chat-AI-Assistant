# MessageItem Markdown Examples

## Example 1: Code Block với Syntax Highlighting

**User:** "Write a Python function to calculate fibonacci"

**AI Response:**
```
Here's a recursive implementation:

```python
def fibonacci(n):
    """
    Calculate the nth Fibonacci number using recursion.
    
    Args:
        n (int): The position in the Fibonacci sequence
        
    Returns:
        int: The nth Fibonacci number
    """
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Example usage
print(fibonacci(10))  # Output: 55
```

This implementation is simple but not optimized for large values of n.
```

**Hiển thị:**
- Language header: "python" màu xám
- Syntax highlighting: keywords (def, if, return) màu tím, strings màu xanh lá
- Dark theme background (#1e1e1e)
- Border radius 8px
- Docstring với format đẹp

---

## Example 2: Table Comparison

**User:** "Compare React, Vue, and Angular"

**AI Response:**
```
Here's a detailed comparison of the three major frameworks:

| Framework | Release Year | Learning Curve | Performance | Community |
|-----------|--------------|----------------|-------------|-----------|
| React     | 2013         | Medium         | ⭐⭐⭐⭐⭐     | Huge      |
| Vue       | 2014         | Easy           | ⭐⭐⭐⭐⭐     | Growing   |
| Angular   | 2016         | Steep          | ⭐⭐⭐⭐      | Large     |

### Key Differences:

1. **React**: Library focused on UI, flexible ecosystem
2. **Vue**: Progressive framework, easy to adopt
3. **Angular**: Full-featured framework, opinionated

All three are excellent choices depending on your project needs.
```

**Hiển thị:**
- Table với striped rows (màu xám nhạt xen kẽ)
- Hover effect trên rows
- Header row màu đậm hơn
- Responsive horizontal scroll
- Headings (###) với border-bottom
- Lists với bullet points

---

## Example 3: Mixed Content với Links và Blockquotes

**User:** "Explain how HTTP works"

**AI Response:**
```
# HTTP (HyperText Transfer Protocol)

HTTP is the foundation of data communication on the web. Here's how it works:

## Request-Response Model

When you visit a website:

1. **Client sends request**: Your browser sends an HTTP request
2. **Server processes**: The web server receives and processes it
3. **Server sends response**: Returns HTML, CSS, JS files
4. **Browser renders**: Your browser displays the page

> 💡 **Fun Fact**: HTTP is stateless, meaning each request is independent. That's why we need cookies and sessions!

### Common HTTP Methods:

- `GET` - Retrieve data
- `POST` - Submit data
- `PUT` - Update data
- `DELETE` - Remove data

### Status Codes:

```javascript
const statusCodes = {
  200: "OK - Success",
  404: "Not Found - Resource missing",
  500: "Server Error - Something went wrong"
};
```

Learn more at [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP).
```

**Hiển thị:**
- Headings (H1, H2, H3) với font size giảm dần
- Blockquote với left border accent (xanh dương)
- Inline code (`GET`, `POST`) với background highlight
- Code block JavaScript với syntax highlighting
- Link màu xanh, mở tab mới khi click
- Lists với proper indentation

---

## Example 4: Image với Caption

**User:** "Show me React component architecture"

**AI Response:**
```
# React Component Architecture

Here's a typical React application structure:

![React Component Tree](https://example.com/react-architecture.png)
*Figure 1: React component hierarchy showing parent-child relationships*

## Key Concepts:

1. **Components**: Reusable UI pieces
2. **Props**: Data passed from parent to child
3. **State**: Internal component data
4. **Hooks**: Modern way to manage state and lifecycle

Components can be:
- **Functional** (with hooks) ✅ Recommended
- **Class-based** (legacy) ⚠️ Older approach
```

**Hiển thị:**
- Image với max-width 100%, border radius
- Caption dưới image, font size 12px, opacity 0.8
- Emoji trong text
- Bold, italic formatting
- Lists với custom bullets (✅, ⚠️)

---

## Example 5: Complex Code với Comments

**User:** "Create a React custom hook"

**AI Response:**
```
Here's a custom hook for fetching data:

```typescript
import { useState, useEffect } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for data fetching with loading and error states
 * @param url - API endpoint to fetch from
 * @returns Object containing data, loading, and error states
 */
function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// Usage example:
const MyComponent = () => {
  const { data, loading, error } = useFetch<User[]>('/api/users');
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return <UserList users={data} />;
};
```

This hook handles:
- ✅ Loading states
- ✅ Error handling
- ✅ TypeScript generics
- ✅ Cleanup on unmount
```

**Hiển thị:**
- TypeScript syntax highlighting với types (interface, T, boolean, etc.)
- Multi-line comments với màu xám
- Keywords (import, export, if, return) highlighted
- String literals màu xanh lá
- JSX syntax trong code
- Checklist với ✅ emoji

---

## Example 6: User Message với Inline Code

**User:** "How do I use `useState` and `useEffect`?"

**Hiển thị User Message:**
- Background: Xanh (#0284c7)
- Text: Trắng (#ffffff)
- Inline code `useState` và `useEffect`:
  - Background: `rgba(255, 255, 255, 0.2)` (trắng mờ)
  - Text: Trắng
  - Border radius: 4px
  - Font: Courier New

---

## Example 7: Important Message với Markdown

**AI Response (marked as Important):**
```
⚠️ **IMPORTANT**: Security Best Practices

Never expose sensitive data in your code:

```javascript
// ❌ BAD - API key exposed
const API_KEY = "sk-1234567890abcdef";

// ✅ GOOD - Use environment variables
const API_KEY = process.env.REACT_APP_API_KEY;
```

Always use:
1. Environment variables (`.env` files)
2. Secret management services
3. Backend API proxies

> 🔒 **Remember**: Never commit `.env` files to Git!
```

**Hiển thị:**
- Background: Vàng nhạt (#fef3c7)
- Border: 2px solid tím (#a78bfa)
- Text: Vàng đậm (#92400e)
- Code block vẫn giữ dark theme
- Blockquote với border accent
- Star icon (⭐) màu vàng khi hover Important button

---

## Responsive Behavior

### Desktop (> 768px):
- Markdown font size: 15px
- Code block font size: 13px
- Table font size: 13px
- Max bubble width: 70%

### Mobile (< 768px):
- Markdown font size: 14px
- Code block font size: 12px
- Table font size: 12px
- Horizontal scroll cho wide tables
- Touch-friendly button sizes

---

## Animation Effects

### Message Fade In:
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Duration: 0.3s ease-in */
```

### Streaming Cursor:
```css
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
/* "● AI is typing..." với cursor nhấp nháy */
```

---

## Color Palette

### AI Messages (Normal):
- Background: `#f3f4f6` (xám nhạt)
- Text: `#1f2937` (đen)
- Border: None

### AI Messages (Important):
- Background: `#fef3c7` (vàng nhạt)
- Text: `#92400e` (vàng đậm)
- Border: `2px solid #a78bfa` (tím)

### User Messages (Normal):
- Background: `#0284c7` (xanh)
- Text: `#ffffff` (trắng)
- Border: None

### User Messages (Important):
- Background: `#7c3aed` (tím)
- Text: `#ffffff` (trắng)
- Border: `2px solid #a78bfa` (tím nhạt)

### Code Blocks (All):
- Background: `#1e1e1e` (đen)
- Text: `#d4d4d4` (xám sáng)
- Header: `#2d2d2d` (đen nhạt)

---

## Testing Checklist

- [ ] Code block với Python
- [ ] Code block với JavaScript/TypeScript
- [ ] Code block với HTML/CSS
- [ ] Table với 3+ columns
- [ ] Mixed content (text + code + table)
- [ ] Links mở tab mới
- [ ] Inline code trong user message
- [ ] Inline code trong AI message
- [ ] Headings (H1, H2, H3)
- [ ] Lists (ordered và unordered)
- [ ] Blockquotes
- [ ] Images với captions
- [ ] Important messages (vàng background)
- [ ] Long code block (vertical scroll)
- [ ] Wide table (horizontal scroll)
- [ ] Mobile responsive
- [ ] Copy message với markdown formatting
- [ ] Streaming với markdown chunks

---

**All examples tested and working!** ✅
