import dotenv from 'dotenv';
import { connectRedis } from './config/redis';
import app from './app';

dotenv.config();

const PORT = process.env.GATEWAY_PORT || 3000;

async function startServer() {
  try {
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`API Gateway running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
}

startServer();

