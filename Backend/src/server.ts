import app from './app';
import config from './config/config';
import { connectDB, sequelize } from './config/database';
import http from "http";
import { createSocketServer } from "./sockets/socket.server";
import { chatSocket } from "./sockets/chat.socket";
import { authenticateSocket } from './middlewares/socketAuth.middleware';
import './models/message.model';
import './models/user.model';
import './models/conversation.model';

const startServer = async () => {
  try {
    // 1. Connect to database
    await connectDB();

    // 2. Create HTTP server
    const server = http.createServer(app);
    
    // 3. Initialize Socket.IO server
    const io = createSocketServer(server);
    
    // 4. Apply socket authentication middleware
    io.use(authenticateSocket);
    
    // 5. Setup chat socket handlers
    chatSocket(io);

    // 6. Start listening
    server.listen(config.port, () => {

    });
  } catch (error) {

    process.exit(1);
  }
};

startServer();


