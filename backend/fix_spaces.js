const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany();
  for (const t of teams) {
    const trimmedName = t.teamName.trim();
    const trimmedCollege = t.collegeName.trim();
    if (trimmedName !== t.teamName || trimmedCollege !== t.collegeName) {
      console.log(`Fixing Team: [${t.teamName}] -> [${trimmedName}]`);
      await prisma.team.update({
        where: { id: t.id },
        data: { teamName: trimmedName, collegeName: trimmedCollege }
      });
    }
  }

  const ps = await prisma.problemStatement.findMany();
  for (const p of ps) {
    if (p.allottedTo && p.allottedTo !== p.allottedTo.trim()) {
      const trimmedAllotted = p.allottedTo.trim();
      console.log(`Fixing Problem Statement AllottedTo: [${p.allottedTo}] -> [${trimmedAllotted}]`);
      await prisma.problemStatement.update({
        where: { id: p.id },
        data: { allottedTo: trimmedAllotted }
      });
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
