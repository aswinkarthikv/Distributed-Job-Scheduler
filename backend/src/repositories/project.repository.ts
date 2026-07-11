import { prisma } from '../database';

export class ProjectRepository {
  async findMany(organizationId: string) {
    return prisma.project.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { queues: true }
        }
      }
    });
  }

  async findById(id: string, organizationId: string) {
    return prisma.project.findFirst({
      where: { id, organizationId }
    });
  }

  async findByName(name: string, organizationId: string) {
    return prisma.project.findFirst({
      where: { name, organizationId }
    });
  }

  async create(data: { name: string; description?: string; organizationId: string }) {
    return prisma.project.create({
      data
    });
  }

  async update(id: string, organizationId: string, data: { name?: string; description?: string }) {
    return prisma.project.updateMany({
      where: { id, organizationId },
      data
    });
  }

  async delete(id: string, organizationId: string) {
    const deleted = await prisma.project.deleteMany({
      where: { id, organizationId }
    });
    return deleted.count > 0;
  }
}
export const projectRepository = new ProjectRepository();
