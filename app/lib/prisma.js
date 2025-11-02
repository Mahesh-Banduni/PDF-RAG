import { PrismaClient } from '../generated/prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  prisma=new PrismaClient();
}

export { prisma };
