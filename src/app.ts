import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { rateLimiter } from './middleware/rateLimiter';
import { metricsMiddleware } from './middleware/metrics';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import userRoutes from './routes/userRoutes';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(metricsMiddleware);
app.use(rateLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'API is running',
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/', userRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
