const { PrismaClient } = require('@prisma/client');

// Prevent multiple instances of Prisma Client in development
// and maintain a singleton in production
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
