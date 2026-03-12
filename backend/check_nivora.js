const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    where: {
      teamName: {
        contains: 'NIVORA',
        mode: 'insensitive'
      }
    }
  });
  console.log('TEAMS FOUND:', JSON.stringify(teams, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
