import { PrismaClient } from '@prisma/client';
import { hashPassword } from './auth/hash';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create superadmin user
  const superadminEmail = 'superadmin@distractionshop.com';
  const superadminPassword = 'ChangeMe123!'; // CHANGE THIS IN PRODUCTION

  const existingUser = await prisma.user.findUnique({
    where: { email: superadminEmail },
  });

  if (existingUser) {
    console.log('✅ Superadmin user already exists');
    return;
  }

  const passwordHash = await hashPassword(superadminPassword);

  const superadmin = await prisma.user.create({
    data: {
      email: superadminEmail,
      passwordHash,
      role: 'superadmin',
    },
  });

  console.log('✅ Superadmin user created:');
  console.log(`   Email: ${superadmin.email}`);
  console.log(`   Password: ${superadminPassword}`);
  console.log('   ⚠️  IMPORTANT: Change this password after first login!');
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
