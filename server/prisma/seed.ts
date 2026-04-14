import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding production baseline data...');

  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('ADMIN_SEED_PASSWORD must be provided and at least 12 characters long');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: 'admin@dgg.com' },
    update: {
      name: 'Administrator',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name: 'Administrator',
      email: 'admin@dgg.com',
      passwordHash,
      role: 'ADMIN',
      status: 'OFFLINE',
      isActive: true,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'route_available' },
    update: {},
    create: { key: 'route_available', value: 'false' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'auto_record' },
    update: {},
    create: { key: 'auto_record', value: 'false' },
  });

  console.log('Seed complete: ensured admin@dgg.com and default system settings.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
