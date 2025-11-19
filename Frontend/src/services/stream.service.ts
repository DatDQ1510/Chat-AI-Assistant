/**
 * Stream Service - Handle streaming API calls with SSE or text/event-stream
 */

interface StreamOptions {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

class StreamService {
  // In production (Docker), VITE_API_URL="" (empty string) for relative paths
  // In development, VITE_API_URL=undefined, fallback to localhost:5000
  private readonly baseURL = import.meta.env.VITE_API_URL !== undefined 
    ? import.meta.env.VITE_API_URL 
    : 'http://localhost:5000';

  /**
   * Stream chat response from backend
   * Supports both SSE and plain text streaming
   */
  async streamChat(prompt: string, options: StreamOptions): Promise<void> {
    const { onChunk, onComplete, onError, signal } = options;

    try {
      const response = await fetch(`${this.baseURL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ prompt }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            onChunk(buffer);
          }
          onComplete();
          break;
        }

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process SSE format if applicable
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove "data: " prefix
            
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              // Try to parse as JSON (OpenAI format)
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || json.content || '';
              if (content) {
                onChunk(content);
              }
            } catch {
              // Not JSON, treat as plain text
              if (data.trim()) {
                onChunk(data);
              }
            }
          } else if (line.trim() && !line.startsWith(':')) {
            // Plain text line (not SSE comment)
            onChunk(line);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Stream aborted');
          onComplete();
        } else {
          onError(error);
        }
      } else {
        onError(new Error('Unknown error occurred'));
      }
    }
  }

  /**
   * Stream with custom endpoint
   */
  async streamCustom(
    endpoint: string,
    payload: Record<string, unknown>,
    options: StreamOptions
  ): Promise<void> {
    const { onChunk, onComplete, onError, signal } = options;

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Stream aborted');
          onComplete();
        } else {
          onError(error);
        }
      } else {
        onError(new Error('Unknown error occurred'));
      }
    }
  }
}

export default new StreamService();
