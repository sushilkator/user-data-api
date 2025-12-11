import { createClient } from 'redis';

export let redisClient: ReturnType<typeof createClient>;

export async function connectRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({ url: redisUrl });
  
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Connecting to Redis...'));
  redisClient.on('ready', () => console.log('Redis Client Ready'));
  
  await redisClient.connect();
  console.log('Connected to Redis');
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    console.log('Disconnected from Redis');
  }
}

