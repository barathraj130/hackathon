// backend/scripts/seedAdmin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('secret_admin_pass_2024', 10);
  
  await prisma.administrator.upsert({
    where: { email: 'admin@institution.edu' },
    update: {},
    create: {
      email: 'admin@institution.edu',
      passwordHash: passwordHash,
    },
  });
  console.log("Root Admin Provisioned.");
}

main();