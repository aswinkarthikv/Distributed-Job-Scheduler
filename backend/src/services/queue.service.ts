import { queueRepository } from '../repositories/queue.repository';
import { projectRepository } from '../repositories/project.repository';

export class QueueService {
  private async verifyProjectAccess(projectId: string, organizationId: string) {
    const project = await projectRepository.findById(projectId, organizationId);
    if (!project) {
      throw new Error('Project not found or access denied.');
    }
    return project;
  }

  async getQueues(projectId: string, organizationId: string) {
    await this.verifyProjectAccess(projectId, organizationId);
    return queueRepository.findMany(projectId);
  }

  async getQueueById(id: string, projectId: string, organizationId: string) {
    await this.verifyProjectAccess(projectId, organizationId);
    const queue = await queueRepository.findById(id, projectId);
    if (!queue) {
      throw new Error('Queue not found.');
    }
    return queue;
  }

  async createQueue(
    organizationId: string,
    data: {
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
    }
  ) {
    await this.verifyProjectAccess(data.projectId, organizationId);

    const existing = await queueRepository.findByName(data.name, data.projectId);
    if (existing) {
      throw new Error(`A queue named "${data.name}" already exists in this project.`);
    }

    return queueRepository.create(data);
  }

  async updateQueue(
    id: string,
    projectId: string,
    organizationId: string,
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
    await this.getQueueById(id, projectId, organizationId);

    if (data.name) {
      const existing = await queueRepository.findByName(data.name, projectId);
      if (existing && existing.id !== id) {
        throw new Error(`A queue named "${data.name}" already exists in this project.`);
      }
    }

    const updated = await queueRepository.update(id, projectId, data);
    if (!updated) {
      throw new Error('Failed to update queue.');
    }
    return updated;
  }

  async deleteQueue(id: string, projectId: string, organizationId: string) {
    await this.getQueueById(id, projectId, organizationId);
    return queueRepository.delete(id, projectId);
  }
}
export const queueService = new QueueService();
