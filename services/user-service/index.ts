import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import app from './app';

dotenv.config();

const PORT = process.env.USER_SERVICE_PORT || 3001;

async function startServer() {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`User Service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start User Service:', error);
    process.exit(1);
  }
}

startServer();

