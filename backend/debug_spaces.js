const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany();
  const problematic = teams.filter(t => t.teamName !== t.teamName.trim() || t.collegeName !== t.collegeName.trim());
  
  console.log('Problematic Teams Found:', problematic.length);
  problematic.forEach(t => {
    console.log(`ID: ${t.id} | Name: [${t.teamName}] | College: [${t.collegeName}]`);
  });

  const ps = await prisma.problemStatement.findMany();
  const problematicPs = ps.filter(p => p.allottedTo && p.allottedTo !== p.allottedTo.trim());
  console.log('\nProblematic Problem Statements Found:', problematicPs.length);
  problematicPs.forEach(p => {
    console.log(`ID: ${p.id} | AllottedTo: [${p.allottedTo}]`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
