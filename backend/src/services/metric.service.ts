import { SystemMetrics } from '../types';
import { jobRepository } from '../repositories/job.repository';
import { workerRepository } from '../repositories/worker.repository';

export class MetricService {
  async getSystemMetrics(): Promise<SystemMetrics> {
    const jobs = await jobRepository.findMany({
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 1000 // get a large sample for telemetry averages
    });
    const workers = await workerRepository.findMany();

    const jobsProcessed = jobs.list.filter(j => j.status === 'completed').length;
    const runningJobs = jobs.list.filter(j => j.status === 'running').length;
    const queuedJobs = jobs.list.filter(j => j.status === 'queued').length;
    const failedJobs = jobs.list.filter(j => j.status === 'failed').length;
    const workersOnline = workers.filter(w => w.status === 'online' || w.status === 'busy').length;

    // Compile fake averages
    const cpuAverage = workers.length > 0
      ? Number((workers.reduce((acc, w) => acc + w.cpuUsage, 0) / workers.length).toFixed(1))
      : 0;
    const memoryAverage = workers.length > 0
      ? Number((workers.reduce((acc, w) => acc + w.memoryUsage, 0) / workers.length).toFixed(1))
      : 0;

    // Timeline for graphs
    const throughputTimeline = [
      { timestamp: '10:00', count: 120 },
      { timestamp: '11:00', count: 185 },
      { timestamp: '12:00', count: 240 },
      { timestamp: '13:00', count: 190 },
      { timestamp: '14:00', count: 310 },
      { timestamp: '15:00', count: 420 },
      { timestamp: '16:00', count: 380 },
      { timestamp: '17:00', count: 450 }
    ];

    return {
      jobsProcessed,
      runningJobs,
      queuedJobs,
      failedJobs,
      workersOnline,
      cpuAverage,
      memoryAverage,
      throughputTimeline,
      queueMetrics: [
        { queueId: 'q-high-priority', queueName: 'High Priority Sync', size: queuedJobs },
        { queueId: 'q-etl-batch', queueName: 'ETL Batch Processing', size: 10 },
        { queueId: 'q-dlq', queueName: 'Dead Letter Queue', size: failedJobs }
      ]
    };
  }
}
export const metricService = new MetricService();
