import { prisma } from '../database';

export class QueueRepository {
  async findMany(projectId: string) {
    return prisma.queue.findMany({
      where: { projectId },
      include: { retryPolicy: true }
    });
  }

  async findById(id: string, projectId: string) {
    return prisma.queue.findFirst({
      where: { id, projectId },
      include: { retryPolicy: true }
    });
  }

  async findByName(name: string, projectId: string) {
    return prisma.queue.findFirst({
      where: { name, projectId }
    });
  }

  async create(data: {
    name: string;
    concurrency: number;
    priority: string;
    paused: boolean;
    projectId: string;
    retryPolicy?: {
      attempts: number;
      backoffFactor: number;
      delay: number;
    };
  }) {
    if (data.retryPolicy) {
      const policy = await prisma.retryPolicy.create({
        data: data.retryPolicy
      });
      return prisma.queue.create({
        data: {
          name: data.name,
          concurrency: data.concurrency,
          priority: data.priority,
          paused: data.paused,
          projectId: data.projectId,
          retryPolicyId: policy.id
        },
        include: { retryPolicy: true }
      });
    }

    return prisma.queue.create({
      data: {
        name: data.name,
        concurrency: data.concurrency,
        priority: data.priority,
        paused: data.paused,
        projectId: data.projectId
      },
      include: { retryPolicy: true }
    });
  }

  async update(
    id: string,
    projectId: string,
    data: {
      name?: string;
      concurrency?: number;
      priority?: string;
      paused?: boolean;
      retryPolicy?: {
        attempts: number;
        backoffFactor: number;
        delay: number;
      };
    }
  ) {
    const queue = await prisma.queue.findFirst({
      where: { id, projectId }
    });

    if (!queue) return null;

    if (data.retryPolicy) {
      if (queue.retryPolicyId) {
        // Update existing retry policy
        await prisma.retryPolicy.update({
          where: { id: queue.retryPolicyId },
          data: data.retryPolicy
        });
      } else {
        // Create a new retry policy
        const newPolicy = await prisma.retryPolicy.create({
          data: data.retryPolicy
        });
        await prisma.queue.update({
          where: { id },
          data: { retryPolicyId: newPolicy.id }
        });
      }
    }

    return prisma.queue.update({
      where: { id },
      data: {
        name: data.name,
        concurrency: data.concurrency,
        priority: data.priority,
        paused: data.paused
      },
      include: { retryPolicy: true }
    });
  }

  async delete(id: string, projectId: string) {
    const queue = await prisma.queue.findFirst({
      where: { id, projectId }
    });

    if (!queue) return false;

    await prisma.queue.delete({
      where: { id }
    });

    if (queue.retryPolicyId) {
      await prisma.retryPolicy.delete({
        where: { id: queue.retryPolicyId }
      }).catch(() => {});
    }

    return true;
  }
}
export const queueRepository = new QueueRepository();
