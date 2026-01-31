const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ps = await prisma.problemStatement.findMany({
    select: { id: true, questionNo: true, allottedTo: true }
  });
  console.log(JSON.stringify(ps, null, 2));
  await prisma.$disconnect();
}

main();
