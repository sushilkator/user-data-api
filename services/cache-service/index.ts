import dotenv from 'dotenv';
import { connectRedis } from './config/redis';
import app from './app';

dotenv.config();

const PORT = process.env.CACHE_SERVICE_PORT || 3002;

async function startServer() {
  try {
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`Cache Service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Cache Service:', error);
    process.exit(1);
  }
}

startServer();

