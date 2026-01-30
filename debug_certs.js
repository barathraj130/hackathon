const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const certs = await prisma.participantCertificate.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(certs, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
