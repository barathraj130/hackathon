const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.problemStatement.count();
  console.log('TOTAL_STATEMENTS:', count);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
