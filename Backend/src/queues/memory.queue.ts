
import { JobsOptions, Queue } from 'bullmq';

import redisConnection from '../config/redis.js';

export const memoryQueue = new Queue(
    'memoryQueue',
    {
        connection: redisConnection,

        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5000
            },
            removeOnComplete: true,
            removeOnFail: true
        },
    }
);
export const addMemoryToQueue = async (memoryId: string, content: string, options?: JobsOptions) => {
  await memoryQueue.add('update-embedding', { memoryId, content }, options);
};




