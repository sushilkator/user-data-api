import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { errorHandler, notFoundHandler } from '../../shared/middleware/errorHandler';
import userRoutes from './routes/userRoutes';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'User Service is running',
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/users', userRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

