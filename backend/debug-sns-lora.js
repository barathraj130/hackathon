const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    where: { 
      OR: [
        { teamName: 'SNS' },
        { teamName: 'LORA' }
      ]
    },
    include: { 
      submission: {
        include: {
          certificates: true
        }
      }
    }
  });
  
  for (const team of teams) {
    console.log('\n======================');
    console.log(`TEAM: ${team.teamName}`);
    console.log(`Team ID: ${team.id}`);
    console.log(`Status: ${team.submission?.status || 'NO SUBMISSION'}`);
    console.log(`PPT URL: ${team.submission?.pptUrl || 'NONE'}`);
    console.log(`Prototype URL: ${team.submission?.prototypeUrl || 'NONE'}`);
    console.log(`Can Regenerate: ${team.submission?.canRegenerate}`);
    console.log(`Submitted At: ${team.submission?.submittedAt || 'NEVER'}`);
    console.log(`Certificates: ${team.submission?.certificates?.length || 0}`);
    if (team.submission?.certificates?.length > 0) {
      team.submission.certificates.forEach(cert => {
        console.log(`  - ${cert.name}: ${cert.certificateUrl || 'NO URL'}`);
      });
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
