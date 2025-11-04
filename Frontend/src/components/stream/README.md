# Streaming Chat Component

A professional, production-ready streaming chat component for React applications with real-time AI responses, full markdown rendering, and modern UI.

## Features

- 🚀 **Real-time Streaming**: Server-Sent Events (SSE) support for smooth streaming
- 📝 **Full Markdown Support**: Headers, lists, tables, code blocks with syntax highlighting
- 👁️ **Preview/Raw Toggle**: Switch between rendered and source markdown view
- 📋 **Copy to Clipboard**: One-click copy functionality
- 📜 **Message History**: Track all prompts and responses in a conversation
- ⏹️ **Abort Streaming**: Cancel ongoing streams at any time
- ⌨️ **Keyboard Shortcuts**: Ctrl+Enter to send, Esc to abort
- 🌙 **Dark Mode**: Automatic dark mode support
- 📱 **Responsive**: Mobile-friendly design
- ♿ **Accessible**: Keyboard navigation and screen reader support

## Installation

The component uses these dependencies:

```bash
npm install react-markdown remark-gfm rehype-raw rehype-highlight highlight.js
```

## Project Structure

```
src/
├── components/stream/
│   ├── StreamingChatBox.tsx       # Main component
│   ├── StreamingChatBox.css       # Component styles
│   ├── MarkdownRenderer.tsx       # Markdown rendering engine
│   └── MarkdownRenderer.css       # Markdown styles
├── services/
│   └── stream.service.ts          # Streaming API client
└── pages/
    └── StreamingChatDemo.tsx      # Demo page
```

## Quick Start

### Basic Usage

```tsx
import StreamingChatBox from './components/stream/StreamingChatBox';

const MyComponent = () => {
  return (
    <StreamingChatBox
      placeholder="Ask me anything..."
      maxHeight="600px"
    />
  );
};
```

### With Callbacks

```tsx
import StreamingChatBox from './components/stream/StreamingChatBox';

const MyComponent = () => {
  const handleStreamComplete = (content: string) => {
    console.log('Stream completed:', content);
    // Save to database, update state, etc.
  };

  const handleError = (error: Error) => {
    console.error('Stream error:', error);
    // Show notification, log error, etc.
  };

  return (
    <StreamingChatBox
      placeholder="Type your message here..."
      maxHeight="700px"
      onStreamComplete={handleStreamComplete}
      onError={handleError}
    />
  );
};
```

## Component API

### StreamingChatBox Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `"Type your message here..."` | Input placeholder text |
| `maxHeight` | `string` | `"600px"` | Maximum height for response area |
| `onStreamComplete` | `(content: string) => void` | `undefined` | Callback when stream completes |
| `onError` | `(error: Error) => void` | `undefined` | Callback on stream error |

### StreamService Methods

```typescript
class StreamService {
  /**
   * Stream chat with OpenAI-compatible endpoint
   * @param prompt - User's prompt/question
   * @param options - Streaming options (callbacks, abort signal)
   */
  async streamChat(
    prompt: string, 
    options: StreamOptions
  ): Promise<void>;

  /**
   * Generic streaming for custom endpoints
   * @param endpoint - API endpoint URL
   * @param payload - Request payload
   * @param options - Streaming options
   */
  async streamCustom(
    endpoint: string,
    payload: Record<string, unknown>,
    options: StreamOptions
  ): Promise<void>;
}
```

### StreamOptions Interface

```typescript
interface StreamOptions {
  onChunk: (chunk: string) => void;      // Called for each streamed chunk
  onComplete: () => void;                // Called when stream ends
  onError: (error: Error) => void;       // Called on error
  signal?: AbortSignal;                  // For aborting stream
}
```

## Backend Requirements

The component expects a `POST /api/chat/stream` endpoint that returns a streaming response.

### Supported Formats

#### 1. Server-Sent Events (SSE) - Recommended

```
data: {"content": "Hello "}
data: {"content": "World"}
data: [DONE]
```

or OpenAI format:

```
data: {"choices": [{"delta": {"content": "Hello "}}]}
data: {"choices": [{"delta": {"content": "World"}}]}
data: [DONE]
```

#### 2. Plain Text Stream

```
Hello 
World
```

### Example Backend (Node.js/Express)

```javascript
app.post('/api/chat/stream', async (req, res) => {
  const { prompt } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Get streaming response from OpenAI or other AI service
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});
```

### Example Backend (Python/FastAPI)

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import openai

app = FastAPI()

@app.post("/api/chat/stream")
async def stream_chat(prompt: str):
    async def generate():
        try:
            stream = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                stream=True
            )
            
            async for chunk in stream:
                content = chunk.choices[0].delta.get("content", "")
                if content:
                    yield f"data: {json.dumps({'content': content})}\n\n"
            
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

## Advanced Usage

### Custom Endpoint

```tsx
// Modify stream.service.ts to use your custom endpoint
const response = await fetch('https://your-api.com/custom/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourToken}`
  },
  body: JSON.stringify({ prompt, userId: 'user123' })
});
```

### Custom Styling

Override CSS variables:

```css
/* In your global CSS or component CSS */
.streaming-chat-box {
  --primary-color: #1890ff;
  --border-radius: 8px;
  --font-family: 'Your Font', sans-serif;
}

.user-message {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

.assistant-message {
  background: #your-background;
  border-left-color: #your-accent;
}
```

### Add Custom Markdown Components

```tsx
// In MarkdownRenderer.tsx
components={{
  // ... existing components
  
  // Add custom video component
  video({ src, ...props }: any) {
    return (
      <video controls style={{ maxWidth: '100%', borderRadius: '8px' }}>
        <source src={src} />
      </video>
    );
  },
  
  // Add custom mermaid diagram support
  code({ inline, className, children }: any) {
    const match = /language-mermaid/.test(className || '');
    if (!inline && match) {
      return <MermaidDiagram chart={String(children)} />;
    }
    // ... existing code block logic
  }
}}
```

## Testing Markdown Rendering

Try these prompts to test different markdown features:

### Code Blocks
```
"Write a Python function to calculate fibonacci numbers"
```

### Tables
```
"Show me a comparison table of React, Vue, and Angular"
```

### Lists and Headers
```
"List the top 5 programming languages with descriptions"
```

### Mixed Content
```
"Explain how HTTP works with headers, code examples, and a table of status codes"
```

## Keyboard Shortcuts

- `Ctrl + Enter` / `Cmd + Enter` - Send message
- `Esc` - Abort streaming (when active)

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (requires polyfill for `ReadableStream`)

## Performance Optimization

### For Large Responses

```typescript
// Limit response length on backend
const stream = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }],
  max_tokens: 2000,  // Limit token count
  stream: true
});
```

### Debounce Rendering

If streaming is too fast, add debouncing:

```tsx
const debouncedSetResponse = useCallback(
  debounce((content: string) => setResponse(content), 50),
  []
);
```

## Troubleshooting

### Stream Not Working

1. **Check CORS**: Ensure backend allows origin
   ```javascript
   app.use(cors({ origin: 'http://localhost:5173' }));
   ```

2. **Check Content-Type**: Must be `text/event-stream`
   ```javascript
   res.setHeader('Content-Type', 'text/event-stream');
   ```

3. **Check Network Tab**: Verify SSE connection in DevTools

### Markdown Not Rendering

1. **Check imports**: Ensure all plugins imported
   ```tsx
   import remarkGfm from 'remark-gfm';
   import rehypeRaw from 'rehype-raw';
   import rehypeHighlight from 'rehype-highlight';
   ```

2. **Check CSS**: Verify `highlight.js` theme imported
   ```tsx
   import 'highlight.js/styles/github-dark.css';
   ```

### Performance Issues

1. **Limit chunk frequency**: Add delay on backend
2. **Reduce max height**: Lower `maxHeight` prop
3. **Clear history**: Add pagination for message history

## Demo

Run the demo page:

```bash
npm run dev
# Navigate to http://localhost:5173/stream-demo
```

## License

MIT

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Credits

- **react-markdown**: Markdown rendering
- **remark-gfm**: GitHub Flavored Markdown
- **rehype-highlight**: Syntax highlighting
- **highlight.js**: Code highlighting engine
- **Ant Design**: UI components

---

**Built with ❤️ for real-time AI chat applications**
