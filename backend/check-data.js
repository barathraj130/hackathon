const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = await prisma.problemStatement.findMany();
  console.log('COUNT:', data.length);
  console.log('DATA:', JSON.stringify(data, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
