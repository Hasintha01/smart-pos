/**
 * Database Seed Script
 * Populates the database with comprehensive dummy data:
 * - Default users (Admin, Manager, Cashier)
 * - Categories
 * - Suppliers
 * - Products with stock
 * - Sample sales transactions
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Hash passwords
  const adminPassword = await hashPassword('admin123');
  const managerPassword = await hashPassword('manager123');
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

  const managerUser = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      password: managerPassword,
      fullName: 'Nimal Silva',
      role: 'MANAGER'
    }
  });

  const cashierUser = await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: {
      username: 'cashier',
      password: cashierPassword,
      fullName: 'Kasun Perera',
      role: 'CASHIER'
    }
  });

  console.log('[OK] Users created:', { 
    admin: adminUser.username,
    manager: managerUser.username,
    cashier: cashierUser.username 
  });

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: { name: 'Beverages', description: 'Soft drinks, juices, and water' }
    }),
    prisma.category.upsert({
      where: { name: 'Snacks' },
      update: {},
      create: { name: 'Snacks', description: 'Chips, biscuits, and quick bites' }
    }),
    prisma.category.upsert({
      where: { name: 'Dairy' },
      update: {},
      create: { name: 'Dairy', description: 'Milk, yogurt, and dairy products' }
    }),
    prisma.category.upsert({
      where: { name: 'Bakery' },
      update: {},
      create: { name: 'Bakery', description: 'Bread, pastries, and baked goods' }
    }),
    prisma.category.upsert({
      where: { name: 'Groceries' },
      update: {},
      create: { name: 'Groceries', description: 'Rice, sugar, flour, and essentials' }
    }),
    prisma.category.upsert({
      where: { name: 'Household' },
      update: {},
      create: { name: 'Household', description: 'Cleaning supplies and household items' }
    })
  ]);

  console.log('[OK] Categories created:', categories.length);

  // Create Suppliers (delete existing first to avoid duplicates)
  await prisma.supplier.deleteMany({});
  
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Lanka Beverages Co.',
        contactPerson: 'Mr. Bandara',
        phone: '0112345678',
        email: 'info@lankabev.lk',
        address: 'No. 123, Galle Road, Colombo 03'
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Fresh Dairy Ltd.',
        contactPerson: 'Mrs. Perera',
        phone: '0117654321',
        email: 'sales@freshdairy.lk',
        address: 'No. 456, Kandy Road, Kadawatha'
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Snack Masters',
        contactPerson: 'Mr. Fernando',
        phone: '0119876543',
        email: 'orders@snackmasters.lk',
        address: 'No. 789, Negombo Road, Wattala'
      }
    })
  ]);

  console.log('[OK] Suppliers created:', suppliers.length);

  // Create Products
  const products = [
    // Beverages
    { name: 'Coca Cola 500ml', barcode: '8888001001', category: categories[0].id, supplier: suppliers[0].id, costPrice: 80, sellingPrice: 120, stockQuantity: 150, reorderLevel: 20 },
    { name: 'Sprite 500ml', barcode: '8888001002', category: categories[0].id, supplier: suppliers[0].id, costPrice: 80, sellingPrice: 120, stockQuantity: 120, reorderLevel: 20 },
    { name: 'Orange Juice 1L', barcode: '8888001003', category: categories[0].id, supplier: suppliers[0].id, costPrice: 180, sellingPrice: 250, stockQuantity: 80, reorderLevel: 15 },
    { name: 'Mineral Water 1L', barcode: '8888001004', category: categories[0].id, supplier: suppliers[0].id, costPrice: 50, sellingPrice: 80, stockQuantity: 200, reorderLevel: 30 },
    { name: 'Energy Drink 250ml', barcode: '8888001005', category: categories[0].id, supplier: suppliers[0].id, costPrice: 150, sellingPrice: 220, stockQuantity: 60, reorderLevel: 15 },
    
    // Snacks
    { name: 'Potato Chips 100g', barcode: '8888002001', category: categories[1].id, supplier: suppliers[2].id, costPrice: 120, sellingPrice: 180, stockQuantity: 100, reorderLevel: 20 },
    { name: 'Cheese Balls 50g', barcode: '8888002002', category: categories[1].id, supplier: suppliers[2].id, costPrice: 80, sellingPrice: 120, stockQuantity: 90, reorderLevel: 15 },
    { name: 'Chocolate Bar', barcode: '8888002003', category: categories[1].id, supplier: suppliers[2].id, costPrice: 100, sellingPrice: 150, stockQuantity: 120, reorderLevel: 25 },
    { name: 'Biscuit Pack 200g', barcode: '8888002004', category: categories[1].id, supplier: suppliers[2].id, costPrice: 140, sellingPrice: 200, stockQuantity: 85, reorderLevel: 20 },
    { name: 'Peanuts 100g', barcode: '8888002005', category: categories[1].id, supplier: suppliers[2].id, costPrice: 90, sellingPrice: 130, stockQuantity: 70, reorderLevel: 15 },
    
    // Dairy
    { name: 'Fresh Milk 1L', barcode: '8888003001', category: categories[2].id, supplier: suppliers[1].id, costPrice: 200, sellingPrice: 280, stockQuantity: 50, reorderLevel: 10 },
    { name: 'Yogurt Cup 100g', barcode: '8888003002', category: categories[2].id, supplier: suppliers[1].id, costPrice: 80, sellingPrice: 120, stockQuantity: 60, reorderLevel: 15 },
    { name: 'Cheese Slice 200g', barcode: '8888003003', category: categories[2].id, supplier: suppliers[1].id, costPrice: 350, sellingPrice: 480, stockQuantity: 40, reorderLevel: 10 },
    { name: 'Butter 250g', barcode: '8888003004', category: categories[2].id, supplier: suppliers[1].id, costPrice: 400, sellingPrice: 550, stockQuantity: 35, reorderLevel: 10 },
    
    // Bakery
    { name: 'White Bread Loaf', barcode: '8888004001', category: categories[3].id, supplier: suppliers[1].id, costPrice: 80, sellingPrice: 120, stockQuantity: 45, reorderLevel: 10 },
    { name: 'Wheat Bread Loaf', barcode: '8888004002', category: categories[3].id, supplier: suppliers[1].id, costPrice: 100, sellingPrice: 150, stockQuantity: 40, reorderLevel: 10 },
    { name: 'Dinner Rolls 6pc', barcode: '8888004003', category: categories[3].id, supplier: suppliers[1].id, costPrice: 120, sellingPrice: 180, stockQuantity: 30, reorderLevel: 8 },
    { name: 'Croissant', barcode: '8888004004', category: categories[3].id, supplier: suppliers[1].id, costPrice: 60, sellingPrice: 100, stockQuantity: 25, reorderLevel: 10 },
    
    // Groceries
    { name: 'Basmati Rice 5kg', barcode: '8888005001', category: categories[4].id, supplier: suppliers[2].id, costPrice: 800, sellingPrice: 1100, stockQuantity: 25, reorderLevel: 5 },
    { name: 'White Sugar 1kg', barcode: '8888005002', category: categories[4].id, supplier: suppliers[2].id, costPrice: 120, sellingPrice: 180, stockQuantity: 50, reorderLevel: 10 },
    { name: 'Wheat Flour 1kg', barcode: '8888005003', category: categories[4].id, supplier: suppliers[2].id, costPrice: 100, sellingPrice: 150, stockQuantity: 45, reorderLevel: 10 },
    { name: 'Cooking Oil 1L', barcode: '8888005004', category: categories[4].id, supplier: suppliers[2].id, costPrice: 380, sellingPrice: 520, stockQuantity: 30, reorderLevel: 8 },
    
    // Household
    { name: 'Dish Soap 500ml', barcode: '8888006001', category: categories[5].id, supplier: suppliers[2].id, costPrice: 120, sellingPrice: 180, stockQuantity: 40, reorderLevel: 10 },
    { name: 'Toilet Paper 4-roll', barcode: '8888006002', category: categories[5].id, supplier: suppliers[2].id, costPrice: 200, sellingPrice: 280, stockQuantity: 35, reorderLevel: 8 },
    { name: 'Laundry Detergent 1kg', barcode: '8888006003', category: categories[5].id, supplier: suppliers[2].id, costPrice: 300, sellingPrice: 420, stockQuantity: 28, reorderLevel: 8 }
  ];

  const createdProducts = [];
  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { barcode: product.barcode },
      update: {},
      create: {
        name: product.name,
        barcode: product.barcode,
        categoryId: product.category,
        supplierId: product.supplier,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        reorderLevel: product.reorderLevel
      }
    });
    createdProducts.push(created);
  }

  console.log('[OK] Products created:', createdProducts.length);

  // Create sample sales transactions
  const now = new Date();
  const salesData = [
    // Sale 1 - Today, Morning
    {
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30),
      items: [
        { productId: createdProducts[0].id, quantity: 2, price: 120 }, // Coca Cola
        { productId: createdProducts[5].id, quantity: 1, price: 180 }, // Potato Chips
        { productId: createdProducts[14].id, quantity: 1, price: 120 }  // White Bread
      ]
    },
    // Sale 2 - Today, Afternoon
    {
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 15),
      items: [
        { productId: createdProducts[3].id, quantity: 3, price: 80 },  // Mineral Water
        { productId: createdProducts[7].id, quantity: 2, price: 150 }, // Chocolate Bar
        { productId: createdProducts[11].id, quantity: 2, price: 120 } // Yogurt
      ]
    },
    // Sale 3 - Yesterday
    {
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 16, 45),
      items: [
        { productId: createdProducts[10].id, quantity: 1, price: 280 }, // Fresh Milk
        { productId: createdProducts[15].id, quantity: 1, price: 150 }, // Wheat Bread
        { productId: createdProducts[19].id, quantity: 1, price: 180 }  // White Sugar
      ]
    },
    // Sale 4 - 2 days ago
    {
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 20),
      items: [
        { productId: createdProducts[18].id, quantity: 1, price: 1100 }, // Rice
        { productId: createdProducts[21].id, quantity: 1, price: 520 },  // Cooking Oil
        { productId: createdProducts[19].id, quantity: 2, price: 180 }   // Sugar
      ]
    },
    // Sale 5 - 3 days ago
    {
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 10, 0),
      items: [
        { productId: createdProducts[1].id, quantity: 2, price: 120 },  // Sprite
        { productId: createdProducts[6].id, quantity: 3, price: 120 },  // Cheese Balls
        { productId: createdProducts[8].id, quantity: 1, price: 200 }   // Biscuit Pack
      ]
    }
  ];

  for (const saleData of salesData) {
    const subtotal = saleData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * 0.05; // 5% tax
    const total = subtotal + taxAmount;

    const sale = await prisma.sale.create({
      data: {
        user: {
          connect: { id: cashierUser.id }
        },
        subtotal: subtotal,
        discountType: null,
        discountValue: 0,
        discountAmount: 0,
        taxAmount: taxAmount,
        total: total,
        createdAt: saleData.date
      }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        saleId: sale.id,
        amount: total,
        paymentMethod: 'CASH',
        createdAt: saleData.date
      }
    });

    for (const item of saleData.items) {
      await prisma.saleItem.create({
        data: {
          sale: {
            connect: { id: sale.id }
          },
          product: {
            connect: { id: item.productId }
          },
          quantity: item.quantity,
          price: item.price,
          discountType: null,
          discountValue: 0,
          discountAmount: 0,
          total: item.price * item.quantity
        }
      });

      // Update stock
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity
          }
        }
      });
    }
  }

  console.log('[OK] Sample sales created:', salesData.length);

  console.log('\n[SUCCESS] Database seeding completed!');
  console.log('\n[INFO] Default Login Credentials:');
  console.log('   Admin:   username = admin,   password = admin123');
  console.log('   Manager: username = manager, password = manager123');
  console.log('   Cashier: username = cashier, password = cashier123');
  console.log('\n[!] IMPORTANT: Change passwords after first login!\n');
  console.log('[INFO] Database Statistics:');
  console.log('   - Users:', 3);
  console.log('   - Categories:', categories.length);
  console.log('   - Suppliers:', suppliers.length);
  console.log('   - Products:', createdProducts.length);
  console.log('   - Sales:', salesData.length);
  console.log('');
}

main()
  .catch((e) => {
    console.error('[ERROR] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
