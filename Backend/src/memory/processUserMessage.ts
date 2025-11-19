import { memoryExtractor } from '../memory/memoryExtractor.js';
import { memoryRepository } from '../repositories/memory.repository.js';
import { addMemoryToQueue } from '../queues/memory.queue.js';

async function processUserMessage(userId: string , message: string) {
  const facts = memoryExtractor.extractFactsFromMessage(message);
  console.log(`🧠 Extracted facts from user message:`, facts);
  for (const f of facts) {
    const memory : any = await memoryRepository.createMemory({
      user_id: userId,
      type: 'fact',
      content: f,
      embedding: null,
      importance: 2,
    });
    console.log(`✅ Created memory for user ${userId}: ID=${memory.id} and memory=${f}:::`, memory); 
    await addMemoryToQueue(memory.id, f); // queue embedding async
  }
}
export default processUserMessage;