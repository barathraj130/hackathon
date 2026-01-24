const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@institution.com';
  const password = 'admin_portal_2026';
  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { password: hash },
    create: {
      email,
      password: hash
    }
  });

  console.log(`Administrator created: ${admin.email}`);
  console.log(`Credentials: ${email} / ${password}`);

  // Create default hackathon config
  const config = await prisma.hackathonConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      durationMinutes: 1440,
      isPaused: true
    }
  });
  console.log('Default hackathon configuration initialized.');

  // Create example team for testing
  const team = await prisma.team.upsert({
    where: { teamName: 'Team Alpha' },
    update: {},
    create: {
      teamName: 'Team Alpha',
      collegeName: 'MIT',
      member1: 'Alice',
      member2: 'Bob',
      dept: 'CS',
      year: 3
    }
  });
  console.log(`Example Team created: ${team.teamName} (Institutional Key: MIT)`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });