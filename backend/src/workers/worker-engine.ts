import { workerRepository } from '../repositories/worker.repository';
import { jobRepository } from '../repositories/job.repository';
import { queueRepository } from '../repositories/queue.repository';
import { prisma } from '../database';
import { calculateRetryDelay } from '../utils/retry';

export class WorkerEngine {
  private id: string;
  private name: string;
  private status: 'online' | 'busy' | 'offline' | 'shutdown' = 'offline';
  private pollingInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private activeJobs: Set<string> = new Set();

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  async start() {
    this.status = 'online';
    await workerRepository.upsert({
      id: this.id,
      name: this.name,
      status: this.status,
      cpuUsage: Math.random() * 10,
      memoryUsage: 20 + Math.random() * 15,
      lastHeartbeat: new Date()
    });

    console.log(`[Worker Engine] Daemon started: ${this.name} (${this.id})`);

    // Periodic tasks
    this.pollingInterval = setInterval(() => this.pollAndExecute(), 2000);
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 5000);
  }

  async stop() {
    console.log(`[Worker Engine] Shutting down gracefully: ${this.name}...`);
    this.status = 'shutdown';

    // Stop trigger timers
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    // Wait for active tasks to complete
    while (this.activeJobs.size > 0) {
      console.log(`[Worker Engine] Waiting for ${this.activeJobs.size} running tasks to finish...`);
      await new Promise((r) => setTimeout(r, 1000));
    }

    await workerRepository.upsert({
      id: this.id,
      name: this.name,
      status: 'offline',
      cpuUsage: 0,
      memoryUsage: 0,
      lastHeartbeat: new Date()
    });
    console.log(`[Worker Engine] Daemon stopped: ${this.name}`);
  }

  private async sendHeartbeat() {
    try {
      const cpu = this.activeJobs.size > 0 ? 30 + Math.random() * 40 : 1 + Math.random() * 5;
      const mem = this.activeJobs.size > 0 ? 60 + Math.random() * 15 : 20 + Math.random() * 5;
      await workerRepository.updateHeartbeat(this.id, cpu, mem);
    } catch (err) {
      console.error('[Worker Engine] Heartbeat update failed:', err);
    }
  }

  private async pollAndExecute() {
    if (this.status === 'shutdown') return;

    try {
      const claimedJob = await this.claimNextJob();
      if (!claimedJob) return;

      this.activeJobs.add(claimedJob.id);
      this.status = 'busy';

      // Spawn execution asynchronously to avoid blocking the main polling loop
      this.runJobPipeline(claimedJob).finally(() => {
        this.activeJobs.delete(claimedJob.id);
        if (this.activeJobs.size === 0 && this.status !== 'shutdown') {
          this.status = 'online';
        }
      });
    } catch (error) {
      console.error('[Worker Engine] Polling cycle failed:', error);
    }
  }

  /**
   * Atomic Job Claiming Transaction.
   * Leverages Prisma transactions to enforce queue limits and prevent duplicate execution.
   */
  private async claimNextJob() {
    return prisma.$transaction(async (tx) => {
      // 1. Get all active queues
      const queues = await tx.queue.findMany({
        where: { paused: false }
      });

      for (const q of queues) {
        // 2. Count active jobs in this queue
        const activeCount = await tx.job.count({
          where: {
            queueId: q.id,
            status: 'running'
          }
        });

        // 3. Check concurrency limit
        if (activeCount >= q.concurrency) {
          continue; // Concurrency limit reached for this queue
        }

        // 4. Query next eligible job (high priority first)
        const nextJob = await tx.job.findFirst({
          where: {
            queueId: q.id,
            status: { in: ['queued', 'scheduled'] },
            OR: [
              { runAt: null },
              { runAt: { lte: new Date() } }
            ]
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'asc' }
          ]
        });

        if (nextJob) {
          // TODO: If this were a distributed multi-node system, we would acquire a Redis lock here
          // Update status immediately to prevent other polls from grabbing it
          const updatedJob = await tx.job.update({
            where: { id: nextJob.id },
            data: {
              status: 'running',
              workerId: this.id,
              startedAt: new Date(),
              attempts: nextJob.attempts + 1
            }
          });

          return updatedJob;
        }
      }

      return null;
    });
  }

  private async runJobPipeline(job: any) {
    const startTime = Date.now();
    console.log(`[Worker Engine] Executing job: ${job.name} (${job.id})`);

    // Log started attempt
    await jobRepository.addLog(job.id, `Job attempt #${job.attempts} started on worker: ${this.name}`, 'info');
    await jobRepository.addExecution({
      jobId: job.id,
      attempt: job.attempts,
      status: 'running',
      startedAt: new Date()
    });

    try {
      const payload = JSON.parse(job.payload || '{}');

      // TODO: In a production worker, we would dynamically load and execute the worker handler code here
      // For this implementation, we simulate execution with a timeout
      const duration = 1000 + Math.random() * 2000;
      await new Promise((r) => setTimeout(r, duration));

      if (payload.shouldFail === true || payload.shouldFail === 'true') {
        throw new Error('Simulated execution failure as requested in job payload.');
      }

      const result = { success: true, processedAt: new Date().toISOString(), message: 'Task completed successfully.' };

      // Success transition
      const endTime = new Date();
      await jobRepository.update(job.id, {
        status: 'completed',
        completedAt: endTime,
        result: JSON.stringify(result)
      });

      await jobRepository.addLog(job.id, `Job completed successfully in ${Date.now() - startTime}ms.`, 'info');
      await jobRepository.addExecution({
        jobId: job.id,
        attempt: job.attempts,
        status: 'completed',
        duration: Date.now() - startTime,
        startedAt: new Date(startTime),
        finishedAt: endTime
      });

    } catch (err: any) {
      const errorMsg = err.message || 'Unknown execution crash.';
      console.error(`[Worker Engine] Job execution failed for ${job.name}:`, errorMsg);

      const endTime = new Date();
      await jobRepository.addLog(job.id, `Job failed: ${errorMsg}`, 'error');

      if (job.attempts >= job.maxAttempts) {
        // Exceeded attempts limit -> Move to DLQ
        await jobRepository.update(job.id, {
          status: 'dead_letter',
          failedAt: endTime,
          error: errorMsg
        });
        await jobRepository.moveToDlq(job.id, errorMsg);
        await jobRepository.addLog(job.id, `Maximum retry limit (${job.maxAttempts}) reached. Relocated to DLQ.`, 'error');

        await jobRepository.addExecution({
          jobId: job.id,
          attempt: job.attempts,
          status: 'dead_letter',
          error: errorMsg,
          duration: Date.now() - startTime,
          startedAt: new Date(startTime),
          finishedAt: endTime
        });
      } else {
        // Enforce backoff scheduling
        // Retrieve retry policy configuration from the queue
        const queue = await queueRepository.findById(job.queueId, job.projectId);
        const policyType = queue?.priority === 'critical' ? 'fixed' : 'exponential';
        const backoffFactor = queue?.retryPolicy?.backoffFactor || 2;
        const initialDelay = queue?.retryPolicy?.delay || 2000;

        const retryDelay = calculateRetryDelay(
          policyType,
          initialDelay,
          job.attempts,
          backoffFactor
        );

        const runAtDate = new Date(Date.now() + retryDelay);

        await jobRepository.update(job.id, {
          status: 'scheduled',
          runAt: runAtDate,
          error: errorMsg
        });

        await jobRepository.addLog(
          job.id,
          `Scheduled for retry in ${retryDelay}ms at ${runAtDate.toISOString()} (Retry attempt #${job.attempts + 1})`,
          'warn'
        );

        await jobRepository.addExecution({
          jobId: job.id,
          attempt: job.attempts,
          status: 'retrying',
          error: errorMsg,
          duration: Date.now() - startTime,
          startedAt: new Date(startTime),
          finishedAt: endTime
        });
      }
    }
  }
}
export default WorkerEngine;
