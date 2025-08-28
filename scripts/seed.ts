import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Start seeding ...

  await prisma.user.create({
    data: {
      email: 'testuser@meqenet.com',
      passwordHash: 'somehash',
      firstName: 'Test',
      lastName: 'User',
      phone: '+251912345678',
    },
  });

  // Seeding finished.
}

main()
  .catch(_e => {
    // Error occurred during seeding
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
