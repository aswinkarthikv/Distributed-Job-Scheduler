import { prisma } from '../database';

export class UserRepository {
  async create(data: { name: string; email: string; passwordHash: string; organizationId: string }) {
    return prisma.user.create({
      data
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { organization: true }
    });
  }
}
export const userRepository = new UserRepository();
