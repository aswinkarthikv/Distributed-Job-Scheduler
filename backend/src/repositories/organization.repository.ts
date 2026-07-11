import { prisma } from '../database';

export class OrganizationRepository {
  async create(name: string) {
    return prisma.organization.create({
      data: { name }
    });
  }

  async findById(id: string) {
    return prisma.organization.findUnique({
      where: { id }
    });
  }
}
export const organizationRepository = new OrganizationRepository();
