const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  console.log('🚀 Starting hackathon data reset...');

  try {
    // 1. Delete dependent data first
    console.log('🗑️ Deleting Participant Certificates...');
    await prisma.participantCertificate.deleteMany({});

    console.log('🗑️ Deleting Submissions...');
    await prisma.submission.deleteMany({});

    console.log('🗑️ Deleting Teams...');
    await prisma.team.deleteMany({});

    console.log('🗑️ Deleting Problem Statements...');
    await prisma.problemStatement.deleteMany({});

    // 2. Reset Hackathon Config
    console.log('⚙️ Resetting Hackathon Configuration...');
    await prisma.hackathonConfig.upsert({
      where: { id: 1 },
      update: {
        startTime: null,
        isPaused: true,
        eventEnded: false,
        durationMinutes: 1440,
        allowCertificateDetails: false
      },
      create: {
        id: 1,
        startTime: null,
        isPaused: true,
        eventEnded: false,
        durationMinutes: 1440,
        allowCertificateDetails: false
      }
    });

    console.log('✅ Hackathon data reset successfully!');
    console.log('Note: Admin accounts have been preserved.');
  } catch (error) {
    console.error('❌ Error during reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reset();
