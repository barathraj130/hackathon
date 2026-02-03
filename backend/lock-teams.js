const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Lock LORA
  await prisma.submission.update({
    where: { teamId: 'f061abbe-84af-40f3-a7da-efa14cf0cb73' },
    data: { 
      status: 'SUBMITTED',
      canRegenerate: false
    }
  });
  console.log('✅ LORA locked');

  // Lock SNS
  await prisma.submission.update({
    where: { teamId: '4013ec23-487b-474f-b980-8a7342fb43b3' },
    data: { 
      status: 'SUBMITTED',
      canRegenerate: false
    }
  });
  console.log('✅ SNS locked');
  
  console.log('\nVerifying...');
  const lora = await prisma.submission.findUnique({ where: { teamId: 'f061abbe-84af-40f3-a7da-efa14cf0cb73' } });
  const sns = await prisma.submission.findUnique({ where: { teamId: '4013ec23-487b-474f-b980-8a7342fb43b3' } });
  
  console.log(`LORA status: ${lora.status}, canRegenerate: ${lora.canRegenerate}`);
  console.log(`SNS status: ${sns.status}, canRegenerate: ${sns.canRegenerate}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
