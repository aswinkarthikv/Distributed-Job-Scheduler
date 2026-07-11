import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import queueRoutes from './routes/queue.routes';
import jobRoutes from './routes/job.routes';
import workerRoutes from './routes/worker.routes';
import retryRoutes from './routes/retry.routes';
import metricRoutes from './routes/metric.routes';
import settingRoutes from './routes/setting.routes';
import { errorHandler } from './middlewares/error.middleware';
import { connectDatabase, disconnectDatabase } from './database';
import { recoveryMonitor } from './scheduler/recovery-monitor';
import { workerService } from './services/worker.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API Status Check
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Distributed Job Scheduler API Router',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Register placeholder routes matching requests
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/retries', retryRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/settings', settingRoutes);

// Error handling middleware
app.use(errorHandler);

let server: any;

async function startServer() {
  await connectDatabase();
  
  // Start stale nodes monitor
  recoveryMonitor.start(10000);

  server = app.listen(PORT, () => {
    console.log(`[Scheduler Control Plane] API is running on http://localhost:${PORT}`);
  });
}

// Graceful Shutdown Handler
async function handleShutdown(signal: string) {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  
  // 1. Stop recovery scheduler
  recoveryMonitor.stop();

  // 2. Shut down running worker engines
  await workerService.shutdownAll();

  // 3. Close Express HTTP listener
  if (server) {
    server.close(() => {
      console.log('[Server] Express HTTP listener closed.');
    });
  }

  // 4. Disconnect Prisma connection pools
  await disconnectDatabase();

  console.log('[Server] Clean exit completed.');
  process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer().catch(err => {
  console.error('Fatal startup error:', err);
});


