import { workerRepository } from '../repositories/worker.repository';
import { jobRepository } from '../repositories/job.repository';
import { prisma } from '../database';

export class RecoveryMonitor {
  private interval: NodeJS.Timeout | null = null;

  start(intervalMs: number = 10000) {
    console.log('[Recovery Monitor] Active. Monitoring worker nodes...');
    this.interval = setInterval(() => this.runCheck(), intervalMs);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    console.log('[Recovery Monitor] Stopped.');
  }

  private async runCheck() {
    try {
      // Threshold: Stale if lastHeartbeat is older than 30 seconds
      const staleThreshold = new Date(Date.now() - 30000);
      const staleWorkers = await workerRepository.findStaleWorkers(staleThreshold);

      if (staleWorkers.length === 0) return;

      console.log(`[Recovery Monitor] Identified ${staleWorkers.length} stale worker nodes.`);

      for (const worker of staleWorkers) {
        // Run database transaction to recover tasks
        await prisma.$transaction(async (tx) => {
          // 1. Mark worker as offline
          await tx.worker.update({
            where: { id: worker.id },
            data: { status: 'offline' }
          });

          // 2. Fetch jobs claimed by this worker in "running" status
          const runningJobs = await tx.job.findMany({
            where: {
              workerId: worker.id,
              status: 'running'
            }
          });

          for (const job of runningJobs) {
            console.log(`[Recovery Monitor] Re-queuing abandoned job: ${job.name} (${job.id})`);

            // TODO: If this were a distributed lock system, we would release locks here
            // Reset status back to queued
            await tx.job.update({
              where: { id: job.id },
              data: {
                status: 'queued',
                workerId: null,
                startedAt: null
              }
            });

            // Log recovery event
            await tx.jobLog.create({
              data: {
                jobId: job.id,
                message: `Worker node "${worker.name}" went offline. Job was abandoned and has been re-queued for recovery.`,
                level: 'warn'
              }
            });

            await tx.jobExecution.create({
              data: {
                jobId: job.id,
                attempt: job.attempts,
                status: 'queued',
                error: 'WorkerNodeLost: Heartbeat timeout. Job recovered.'
              }
            });
          }
        });
      }
    } catch (err) {
      console.error('[Recovery Monitor] Error in recovery checker loop:', err);
    }
  }
}
export const recoveryMonitor = new RecoveryMonitor();
export default recoveryMonitor;
