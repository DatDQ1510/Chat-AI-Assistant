const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
  
  // Join a test conversation
  const testConversationId = 'test-conversation-123';
  socket.emit('join_conversation', testConversationId);
  console.log('📌 Joined conversation:', testConversationId);
  
  // Listen for events
  socket.on('receive_message', (msg) => {
    console.log('📩 Received message:', msg);
  });
  
  socket.on('ai_message_init', (aiMsg) => {
    console.log('🤖 AI init:', aiMsg);
  });
  
  socket.on('ai_stream', (data) => {
    console.log('📨 AI chunk:', data.chunk);
  });
  
  socket.on('ai_stream_end', (data) => {
    console.log('✅ AI finished:', data.message_id);
    console.log('📝 Full content:', data.full_content);
    process.exit(0);
  });
  
  socket.on('error_message', (err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
  
  // Send a test message after 1 second
  setTimeout(() => {
    console.log('\n📤 Sending test message...\n');
    socket.emit('send_message', {
      conversation_id: testConversationId,
      user_id: 'test-user-123',
      content: 'Hello, can you introduce yourself?',
    });
  }, 1000);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('⏱️ Timeout - no response received');
  process.exit(1);
}, 30000);
