import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[Database] PostgreSQL connection established successfully via Prisma ORM.');
  } catch (error) {
    console.error('[Database] Warning: Failed to connect to PostgreSQL on startup. Relational endpoints will return errors until database is reachable.', error);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('[Database] Disconnected connection pool.');
}
