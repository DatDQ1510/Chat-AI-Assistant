import "../queues/summary.worker";
import "../queues/message.worker";
import "../queues/memory.worker";

console.log("✅ Job workers are running...");

// Graceful shutdown for workers
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down workers gracefully...`);
  
  // Give workers time to finish current jobs
  setTimeout(() => {
    console.log('✅ Workers stopped');
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
