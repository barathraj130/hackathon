const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Fetching latest artifacts from the repository...\n');
  
  const submissions = await prisma.submission.findMany({
    include: {
      team: true,
      certificates: true
    },
    orderBy: {
      submittedAt: 'desc'
    },
    take: 5
  });

  if (submissions.length === 0) {
    console.log('📂 No artifacts found in the repository.');
    return;
  }

  submissions.forEach((sub, index) => {
    console.log(`--- [${index + 1}] Team: ${sub.team?.teamName || 'Unknown'} ---`);
    console.log(`Status: ${sub.status}`);
    console.log(`PPT URL: ${sub.pptUrl || 'None'}`);
    console.log(`Prototype: ${sub.prototypeUrl || 'None'}`);
    
    if (sub.certificates && sub.certificates.length > 0) {
      console.log('Certificates:');
      sub.certificates.forEach(cert => {
        console.log(`  - ${cert.name}: ${cert.certificateUrl || 'Pending'}`);
      });
    }
    console.log('\n');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
