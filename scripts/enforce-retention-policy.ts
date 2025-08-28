import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RETENTION_YEARS = 2;

async function main(): Promise<void> {
  // Starting data retention policy enforcement...

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - RETENTION_YEARS);

  // Find users marked for deletion for more than 2 years
  const usersToDelete = await prisma.user.findMany({
    where: {
      retentionPolicy: 'DELETED',
      deletedAt: {
        lt: twoYearsAgo,
      },
    },
  });

  if (usersToDelete.length === 0) {
    return;
  }

  for (const user of usersToDelete) {
    // This is a hard delete. Be careful with this in production.
    // You might want to archive the data first.
    await prisma.user.delete({ where: { id: user.id } });
  }

  // Data retention policy enforcement finished.
}

main()
  .catch(_e => {
    // Error occurred during data retention policy enforcement
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
