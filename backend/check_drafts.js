const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany();
  console.log('CHECKING TEAMS DRAFT STATUS:\n');
  
  for (const team of teams) {
    if (team.pitchDraft) {
      try {
        const draft = JSON.parse(team.pitchDraft);
        const fields = Object.entries(draft).filter(([k, v]) => {
          if (Array.isArray(v)) return v.length === 0;
          if (typeof v === 'object' && v !== null) return Object.keys(v).length === 0;
          return !v;
        });
        
        console.log(`Team: ${team.teamName}`);
        console.log(`- Project: ${draft.projectName || 'EMPTY'}`);
        console.log(`- Empty Fields Count: ${fields.length}`);
        if (fields.length > 0) {
          console.log(`- First 5 Empty: ${fields.slice(0, 5).map(f => f[0]).join(', ')}`);
        }
      } catch (e) {
        console.log(`Team: ${team.teamName} - INVALID DRAFT`);
      }
    } else {
      console.log(`Team: ${team.teamName} - NO DRAFT FOUND`);
    }
    console.log('-------------------');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
