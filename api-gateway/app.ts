import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { rateLimiter } from './middleware/rateLimiter';
import { metricsMiddleware } from './middleware/metrics';
import { errorHandler, notFoundHandler } from '../shared/middleware/errorHandler';
import userRoutes from './routes/userRoutes';
import cacheRoutes from './routes/cacheRoutes';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(metricsMiddleware);
app.use(rateLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'API Gateway is running',
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/users', userRoutes);
app.use('/cache', cacheRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

