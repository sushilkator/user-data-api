import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { errorHandler, notFoundHandler } from '../../shared/middleware/errorHandler';
import cacheRoutes from './routes/cacheRoutes';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Cache Service is running',
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/cache', cacheRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

