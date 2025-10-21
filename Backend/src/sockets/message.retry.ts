// message.retry.ts - Message delivery retry logic
import { getIO } from "./socket.server";
import { addToFailedMessageQueue } from "../queues/message.queue";

/**
 * Retry sending a message to a conversation room
 * @param conversationId - Target conversation ID
 * @param message - Message object to send
 * @param retries - Number of retry attempts (default: 3)
 */
export async function retrySendMessage(
  conversationId: string,
  message: any,
  clientSocketId: string,
  retries = 3
): Promise<void> {
  const io = getIO();

  for (let i = 1; i <= retries; i++) {
    try {
      // Check client still online
      const targetSocket = io.sockets.sockets.get(clientSocketId);
      if (!targetSocket) {
        throw new Error(`Client ${clientSocketId} offline during retry`);
      }

      // Exponential backoff
      if (i > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * i));
      }

      // Use ACK emit
      await new Promise<void>((resolve, reject) => {
        targetSocket.timeout(3000).emit("receive_message", message, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`✅ Retry ${i}/${retries} success for message ${message.id} → ${clientSocketId}`);
      return;

    } catch (err) {
      console.warn(`⚠️ Retry ${i}/${retries} failed for message ${message.id}`, err);

      if (i === retries) {
        console.error(`❌ Message ${message.id} failed completely → queue`);
        await addToFailedMessageQueue({
          messageId: message.id,
          conversationId,
          message,
          reason: `Retry delivery failed for socket ${clientSocketId}`,
        });
      }
    }
  }
}