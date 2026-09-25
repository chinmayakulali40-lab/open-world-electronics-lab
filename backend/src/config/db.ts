import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✓ Successfully connected to PostgreSQL via Prisma ORM');
  } catch (error) {
    console.error('✗ PostgreSQL connection error:', error);
    process.exit(1);
  }
};
