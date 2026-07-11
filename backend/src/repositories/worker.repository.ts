import { prisma } from '../database';

export class WorkerRepository {
  async findMany() {
    return prisma.worker.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { jobs: { where: { status: 'running' } } }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.worker.findUnique({
      where: { id },
      include: { jobs: { where: { status: 'running' } } }
    });
  }

  async findByName(name: string) {
    return prisma.worker.findUnique({
      where: { name }
    });
  }

  async upsert(data: {
    id: string;
    name: string;
    status: string;
    cpuUsage: number;
    memoryUsage: number;
    lastHeartbeat: Date;
  }) {
    return prisma.worker.upsert({
      where: { id: data.id },
      update: {
        status: data.status,
        cpuUsage: data.cpuUsage,
        memoryUsage: data.memoryUsage,
        lastHeartbeat: data.lastHeartbeat
      },
      create: {
        id: data.id,
        name: data.name,
        status: data.status,
        cpuUsage: data.cpuUsage,
        memoryUsage: data.memoryUsage,
        lastHeartbeat: data.lastHeartbeat
      }
    });
  }

  async delete(id: string) {
    const deleted = await prisma.worker.deleteMany({
      where: { id }
    });
    return deleted.count > 0;
  }

  async updateHeartbeat(id: string, cpuUsage: number, memoryUsage: number) {
    await prisma.workerHeartbeat.create({
      data: {
        workerId: id,
        cpuUsage,
        memoryUsage
      }
    });

    return prisma.worker.update({
      where: { id },
      data: {
        cpuUsage,
        memoryUsage,
        lastHeartbeat: new Date(),
        status: 'online'
      }
    });
  }

  async findStaleWorkers(thresholdDate: Date) {
    return prisma.worker.findMany({
      where: {
        lastHeartbeat: { lt: thresholdDate },
        status: { in: ['online', 'busy'] }
      }
    });
  }
}
export const workerRepository = new WorkerRepository();
export default workerRepository;
