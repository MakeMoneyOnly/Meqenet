import { PrismaClient, UserRole, KycStatus, RiskLevel } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as argon2 from 'argon2';
import { createCipheriv, randomBytes, scryptSync } from 'crypto';

// Constants
const MIN_ENCRYPTION_KEY_LENGTH = 32;
const SCRYPT_KEY_LENGTH = 32;
const SAMPLE_USERS_COUNT = 50;
const FAYDA_ID_PREFIX = '1234567890';
const FAYDA_ID_PADDING_LENGTH = 2;
const FAYDA_ID_PADDING_CHAR = '0';
const AES_IV_LENGTH = 16;

// Ethiopian name arrays for seeding
const ethiopianFirstNames = [
  'Abebe', 'Chala', 'Desta', 'Fikre', 'Gebre', 'Haile', 'Ibrahim', 'Jemal',
  'Kaleb', 'Lidet', 'Mekonnen', 'Negasi', 'Oli', 'Paulos', 'Qetsela',
  'Robel', 'Samuel', 'Tadesse', 'Umar', 'Yonas',
];

const ethiopianLastNames = [
  'Bekele', 'Demissie', 'Girma', 'Hailemariam', 'Kebede', 'Lemma', 'Mamo',
  'Nigussie', 'Ojera', 'Petros', 'Regassa', 'Sisay', 'Tsegaye',
  'Woldemichael', 'Zewde',
];

const prisma = new PrismaClient();

// Encryption setup
const encryptionKey = process.env.E2E_DB_ENCRYPTION_KEY;
if (!encryptionKey || encryptionKey.length < MIN_ENCRYPTION_KEY_LENGTH) {
  throw new Error(
    'E2E_DB_ENCRYPTION_KEY must be set and be at least 32 characters long.'
  );
}
const algorithm = 'aes-256-cbc';
const key = scryptSync(encryptionKey, 'salt', SCRYPT_KEY_LENGTH);

function encrypt(text: string): Buffer {
  const iv = randomBytes(AES_IV_LENGTH);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

async function main(): Promise<void> {
  const password = await argon2.hash('Password123!');

  // Create Roles
  const roles = Object.values(UserRole);
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }

  // Create Users
  for (let i = 0; i < SAMPLE_USERS_COUNT; i++) {
    const firstName = ethiopianFirstNames[i % ethiopianFirstNames.length];
    const lastName = ethiopianLastNames[i % ethiopianLastNames.length];
    const email = faker.internet.email({
      firstName: firstName,
      lastName: lastName,
      provider: 'meqenet.et'
    }).toLowerCase();
    const faydaId = `${FAYDA_ID_PREFIX}${i.toString().padStart(FAYDA_ID_PADDING_LENGTH, FAYDA_ID_PADDING_CHAR)}`;

    await prisma.user.create({
      data: {
        email: email,
        passwordHash: password,
        firstName: firstName,
        lastName: lastName,
        displayName: `${firstName} ${lastName}`,
        phone: faker.phone.number(),
        emailVerified: faker.datatype.boolean(),
        phoneVerified: faker.datatype.boolean(),
        kycStatus: faker.helpers.arrayElement(Object.values(KycStatus)),
        status: 'ACTIVE',
        role: faker.helpers.arrayElement([
          UserRole.CUSTOMER,
          UserRole.MERCHANT,
        ]),
        riskLevel: faker.helpers.arrayElement(Object.values(RiskLevel)),
        faydaIdHash: encrypt(faydaId),
        createdAt: faker.date.past(),
      },
    });
  }
}

main()
  .catch((e: unknown) => {
    throw new Error(
      `Seeding failed: ${e instanceof Error ? e.message : String(e)}`
    );
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
