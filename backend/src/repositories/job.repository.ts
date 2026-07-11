import { prisma } from '../database';

export class JobRepository {
  async findMany(filters: {
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
  }) {
    const where: any = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.queueId) where.queueId = filters.queueId;
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { id: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const skip = (filters.page - 1) * filters.limit;

    const [total, list] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
        include: {
          queue: { select: { name: true } },
          project: { select: { name: true } }
        }
      })
    ]);

    return { total, list };
  }

  async findById(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: {
        executions: { orderBy: { createdAt: 'desc' } },
        logs: { orderBy: { timestamp: 'desc' } },
        deadLetterJobs: true
      }
    });
  }

  async create(data: {
    name: string;
    type: string;
    status: string;
    payload: string;
    priority: number;
    delay: number;
    cron?: string;
    runAt?: Date;
    queueId: string;
    projectId: string;
    batchId?: string;
    maxAttempts: number;
  }) {
    return prisma.job.create({
      data
    });
  }

  async createMany(jobs: {
    name: string;
    type: string;
    status: string;
    payload: string;
    priority: number;
    delay: number;
    queueId: string;
    projectId: string;
    batchId?: string;
    maxAttempts: number;
  }[]) {
    return prisma.job.createMany({
      data: jobs
    });
  }

  async update(id: string, updates: any) {
    return prisma.job.update({
      where: { id },
      data: updates
    });
  }

  async delete(id: string) {
    const deleted = await prisma.job.deleteMany({
      where: { id }
    });
    return deleted.count > 0;
  }

  async addLog(jobId: string, message: string, level: 'info' | 'warn' | 'error' = 'info') {
    return prisma.jobLog.create({
      data: {
        jobId,
        message,
        level
      }
    });
  }

  async addExecution(data: {
    jobId: string;
    attempt: number;
    status: string;
    error?: string;
    duration?: number;
    startedAt: Date;
    finishedAt?: Date;
  }) {
    return prisma.jobExecution.create({
      data
    });
  }

  async moveToDlq(jobId: string, error?: string) {
    return prisma.deadLetterJob.create({
      data: {
        jobId,
        error
      }
    });
  }
}
export const jobRepository = new JobRepository();
