import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`Start seeding ...`);

  // Create Users - FinTech compliance: Seed data for testing
  const SEED_USER_COUNT = 10;
  for (let i = 0; i < SEED_USER_COUNT; i++) {
    await prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        // Add other user fields as necessary
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeding finished.`);
}

main()
  .catch(e => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
