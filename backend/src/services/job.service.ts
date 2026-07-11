import { jobRepository } from '../repositories/job.repository';
import { queueRepository } from '../repositories/queue.repository';
import { projectRepository } from '../repositories/project.repository';
import { calculateRetryDelay } from '../utils/retry';

export class JobService {
  private async verifyProjectAccess(projectId: string, organizationId: string) {
    const project = await projectRepository.findById(projectId, organizationId);
    if (!project) {
      throw new Error('Project not found or access denied.');
    }
    return project;
  }

  async createJob(
    organizationId: string,
    data: {
      name: string;
      type: string;
      payload: Record<string, any>;
      priority: number;
      delay: number;
      cron?: string;
      runAt?: string;
      queueId: string;
      projectId: string;
      batchId?: string;
      maxAttempts: number;
      batchJobs?: { name: string; payload: Record<string, any> }[];
    }
  ) {
    await this.verifyProjectAccess(data.projectId, organizationId);

    // Verify queue exists
    const queue = await queueRepository.findById(data.queueId, data.projectId);
    if (!queue) {
      throw new Error('Queue not found in this project.');
    }

    const payloadString = JSON.stringify(data.payload);

    // Calculate runAt date for delayed/scheduled jobs
    let runAtDate: Date | undefined;
    let initialStatus = 'queued';

    if (data.type === 'delayed' && data.delay > 0) {
      runAtDate = new Date(Date.now() + data.delay);
      initialStatus = 'scheduled';
    } else if (data.type === 'scheduled' && data.runAt) {
      runAtDate = new Date(data.runAt);
      initialStatus = 'scheduled';
    } else if (data.type === 'recurring' && data.cron) {
      // TODO: Parse cron and get first execution date. For now, seed next run as now.
      runAtDate = new Date();
      initialStatus = 'scheduled';
    }

    // 1. Batch jobs creation
    if (data.type === 'batch' && data.batchJobs && data.batchJobs.length > 0) {
      const batchId = data.batchId || Math.random().toString(36).substring(2, 15);
      const jobsToCreate = data.batchJobs.map((bj) => ({
        name: bj.name,
        type: 'batch',
        status: 'queued',
        payload: JSON.stringify(bj.payload),
        priority: data.priority,
        delay: 0,
        queueId: data.queueId,
        projectId: data.projectId,
        batchId,
        maxAttempts: data.maxAttempts
      }));

      await jobRepository.createMany(jobsToCreate);

      // Return a coordinator job representing the batch
      const batchCoordinator = await jobRepository.create({
        name: `${data.name} (Batch Coordinator)`,
        type: 'batch',
        status: 'completed',
        payload: payloadString,
        priority: data.priority,
        delay: 0,
        queueId: data.queueId,
        projectId: data.projectId,
        batchId,
        maxAttempts: 1
      });

      await jobRepository.addLog(batchCoordinator.id, `Batch enqueued with ${jobsToCreate.length} child tasks.`);
      return batchCoordinator;
    }

    // 2. Standard single job creation
    const job = await jobRepository.create({
      name: data.name,
      type: data.type,
      status: initialStatus,
      payload: payloadString,
      priority: data.priority,
      delay: data.delay,
      cron: data.cron,
      runAt: runAtDate,
      queueId: data.queueId,
      projectId: data.projectId,
      batchId: data.batchId,
      maxAttempts: data.maxAttempts
    });

    await jobRepository.addLog(job.id, `Job initialized successfully. Status: ${initialStatus}`);
    return job;
  }

  async getJobs(
    organizationId: string,
    filters: {
      projectId?: string;
      queueId?: string;
      status?: string;
      search?: string;
      fromDate?: string;
      toDate?: string;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
      page: number;
      limit: number;
    }
  ) {
    if (filters.projectId) {
      await this.verifyProjectAccess(filters.projectId, organizationId);
    }
    return jobRepository.findMany(filters);
  }

  async getJobById(id: string, organizationId: string) {
    const job = await jobRepository.findById(id);
    if (!job) {
      throw new Error('Job not found.');
    }
    await this.verifyProjectAccess(job.projectId, organizationId);
    return job;
  }

  async getJobLogs(id: string, organizationId: string) {
    const job = await this.getJobById(id, organizationId);
    return job.logs;
  }

  async cancelJob(id: string, organizationId: string) {
    const job = await this.getJobById(id, organizationId);
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      throw new Error(`Job cannot be cancelled from status "${job.status}"`);
    }

    const updated = await jobRepository.update(id, {
      status: 'cancelled',
      completedAt: new Date()
    });

    await jobRepository.addLog(id, 'Job execution cancelled manually from control plane.', 'warn');
    return updated;
  }

  async triggerRetry(id: string, organizationId: string) {
    const job = await this.getJobById(id, organizationId);

    // Retrieve retry policy configuration from the queue
    const queue = await queueRepository.findById(job.queueId, job.projectId);
    const policyType = queue?.priority === 'critical' ? 'fixed' : 'exponential'; // fallback mapping
    const backoffFactor = queue?.retryPolicy?.backoffFactor || 2;
    const initialDelay = queue?.retryPolicy?.delay || 2000;

    const retryDelay = calculateRetryDelay(
      policyType,
      initialDelay,
      job.attempts + 1,
      backoffFactor
    );

    const runAtDate = new Date(Date.now() + retryDelay);

    // Update job status to retrying/scheduled
    const updated = await jobRepository.update(id, {
      status: 'scheduled',
      attempts: job.attempts + 1,
      runAt: runAtDate,
      error: null
    });

    await jobRepository.addLog(
      id,
      `Manual retry dispatched. Scheduled to run after backoff delay of ${retryDelay}ms at ${runAtDate.toISOString()}`
    );

    // Log the manual retry history entry
    await jobRepository.addExecution({
      jobId: id,
      attempt: job.attempts + 1,
      status: 'scheduled',
      startedAt: new Date()
    });

    return updated;
  }

  async deleteJob(id: string, organizationId: string) {
    await this.getJobById(id, organizationId);
    return jobRepository.delete(id);
  }
}
export const jobService = new JobService();
