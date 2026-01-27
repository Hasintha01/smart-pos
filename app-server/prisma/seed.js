/**
 * Database Seed Script
 * Populates the database with initial data:
 * - Default users (Admin, Cashier)
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Hash passwords
  const adminPassword = await hashPassword('admin123');
  const cashierPassword = await hashPassword('cashier123');

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      fullName: 'System Administrator',
      role: 'ADMIN'
    }
  });

  const cashierUser = await prisma.user.upsert({
    where: { username: 'cashier1' },
    update: {},
    create: {
      username: 'cashier1',
      password: cashierPassword,
      fullName: 'Kasun Perera',
      role: 'CASHIER'
    }
  });

  console.log('✅ Users created:', { 
    admin: adminUser.username,
    cashier: cashierUser.username 
  });

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Default Login Credentials:');
  console.log('   Admin: username = admin, password = admin123');
  console.log('   Cashier: username = cashier1, password = cashier123');
  console.log('\n⚠️  IMPORTANT: Change passwords after first login!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
