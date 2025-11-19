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
    console.log('✅ Database connected successfully');
    // 2. Create HTTP server
    const server = http.createServer(app);
    
    // 3. Initialize Socket.IO server
    const io = createSocketServer(server);
    
    // 4. Apply socket authentication middleware
    io.use(authenticateSocket);
    
    chatSocket(io);

    server.listen(config.port, () => {
      console.log(`✅ Server is running on port ${config.port}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          await sequelize.close();
          console.log('✅ Database connections closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error : any) {
    console.error(`❌ Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();


