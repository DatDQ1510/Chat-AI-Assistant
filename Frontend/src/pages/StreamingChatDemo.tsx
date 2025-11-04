/**
 * StreamingChatDemo.tsx - Demo page for StreamingChatBox component
 * Shows how to integrate the streaming chat component with custom configuration
 */

import React from 'react';
import { Card, Typography, Space, Divider } from 'antd';
import StreamingChatBox from '../components/stream/StreamingChatBox';

const { Title, Paragraph, Text } = Typography;

const StreamingChatDemo: React.FC = () => {
  const handleStreamComplete = (content: string) => {
    console.log('Stream completed. Final content length:', content.length);
  };

  const handleError = (error: Error) => {
    console.error('Stream error:', error);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Title level={2}>Streaming Chat Component Demo</Title>
          <Paragraph>
            This page demonstrates the <Text code>StreamingChatBox</Text> component with real-time
            AI streaming responses, markdown rendering, and professional UI.
          </Paragraph>
          
          <Divider />
          
          <Title level={4}>Features:</Title>
          <ul>
            <li>🚀 Real-time streaming with Server-Sent Events (SSE)</li>
            <li>📝 Full markdown support with syntax highlighting</li>
            <li>👁️ Preview/Raw toggle to see markdown source</li>
            <li>📋 One-click copy to clipboard</li>
            <li>📜 Message history with user prompts and AI responses</li>
            <li>⏹️ Abort streaming at any time</li>
            <li>⌨️ Keyboard shortcuts (Ctrl+Enter to send)</li>
            <li>🌙 Dark mode support</li>
            <li>📱 Fully responsive design</li>
          </ul>

          <Divider />

          <Title level={4}>Usage Example:</Title>
          <pre style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '16px',
            borderRadius: '6px',
            overflow: 'auto'
          }}>
{`import StreamingChatBox from './components/stream/StreamingChatBox';

const MyComponent = () => {
  const handleComplete = (content: string) => {
    console.log('Stream completed:', content);
  };

  const handleError = (error: Error) => {
    console.error('Stream error:', error);
  };

  return (
    <StreamingChatBox
      placeholder="Ask me anything..."
      maxHeight="600px"
      onStreamComplete={handleComplete}
      onError={handleError}
    />
  );
};`}
          </pre>

          <Divider />

          <Title level={4}>Backend Requirements:</Title>
          <Paragraph>
            The component expects a <Text code>POST /api/chat/stream</Text> endpoint that returns
            a streaming response in one of these formats:
          </Paragraph>
          
          <ul>
            <li>
              <Text strong>SSE format:</Text> <Text code>data: {'{'}...{'}'}\n\n</Text> with{' '}
              <Text code>data: [DONE]</Text> signal
            </li>
            <li>
              <Text strong>OpenAI format:</Text> <Text code>choices[0].delta.content</Text> or{' '}
              <Text code>content</Text> field
            </li>
            <li>
              <Text strong>Plain text:</Text> Raw text chunks streamed over the connection
            </li>
          </ul>

          <Paragraph>
            Example request payload: <Text code>{'{'}prompt: "Your question here"{'}'}</Text>
          </Paragraph>

          <Divider />

          <Title level={4}>Try It Out:</Title>
          <Paragraph>
            Type a message below and press <Text keyboard>Ctrl</Text> + <Text keyboard>Enter</Text>{' '}
            or click <Text strong>Send</Text> to start streaming. You can:
          </Paragraph>
          <ul>
            <li>Test markdown rendering (headers, lists, code blocks, tables)</li>
            <li>Toggle between Preview and Raw view</li>
            <li>Copy the response to clipboard</li>
            <li>Clear history to start fresh</li>
            <li>Abort streaming if needed</li>
          </ul>
        </Card>

        {/* Demo Component */}
        <Card title="Live Demo">
          <StreamingChatBox
            placeholder="Ask me anything... Try asking for markdown examples!"
            maxHeight="600px"
            onStreamComplete={handleStreamComplete}
            onError={handleError}
          />
        </Card>

        {/* Tips */}
        <Card title="💡 Tips">
          <Space direction="vertical">
            <Paragraph>
              <Text strong>Test Markdown Rendering:</Text>
              <br />
              Try asking: "Show me a markdown example with headers, code block, and a table"
            </Paragraph>
            
            <Paragraph>
              <Text strong>Test Code Highlighting:</Text>
              <br />
              Try asking: "Write a Python function to calculate fibonacci numbers"
            </Paragraph>
            
            <Paragraph>
              <Text strong>Test Long Responses:</Text>
              <br />
              Try asking: "Explain how React hooks work in detail"
            </Paragraph>
            
            <Paragraph>
              <Text strong>Toggle View Modes:</Text>
              <br />
              Switch between Preview and Raw to see the markdown source vs rendered output
            </Paragraph>

            <Paragraph>
              <Text strong>Check Browser Console:</Text>
              <br />
              Open DevTools to see <Text code>onStreamComplete</Text> and{' '}
              <Text code>onError</Text> callback logs
            </Paragraph>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default StreamingChatDemo;
