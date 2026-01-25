/**
 * Database Seed Script
 * Populates the database with initial data:
 * - Default roles (Admin, Manager, Cashier)
 * - Default admin user
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full system access - can manage users, view all reports, modify settings',
      permissions: JSON.stringify({
        users: ['create', 'read', 'update', 'delete'],
        products: ['create', 'read', 'update', 'delete'],
        sales: ['create', 'read', 'update', 'delete'],
        reports: ['view_profit', 'view_all'],
        settings: ['manage']
      })
    }
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Can manage inventory and view reports, cannot manage users',
      permissions: JSON.stringify({
        products: ['create', 'read', 'update'],
        sales: ['read'],
        reports: ['view_sales', 'view_inventory'],
        expenses: ['create', 'read']
      })
    }
  });

  const cashierRole = await prisma.role.upsert({
    where: { name: 'Cashier' },
    update: {},
    create: {
      name: 'Cashier',
      description: 'Can only make sales, no access to costs or profits',
      permissions: JSON.stringify({
        sales: ['create'],
        products: ['read']
      })
    }
  });

  console.log('✅ Roles created:', { adminRole, managerRole, cashierRole });

  // Create default admin user
  // Password: admin123 (should be changed on first login in production)
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@smartpos.local',
      password: hashedPassword,
      fullName: 'System Administrator',
      roleId: adminRole.id,
      isActive: true
    }
  });

  console.log('✅ Admin user created:', {
    username: adminUser.username,
    email: adminUser.email,
    role: 'Admin'
  });

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Default Login Credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('\n⚠️  IMPORTANT: Change the admin password after first login!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
