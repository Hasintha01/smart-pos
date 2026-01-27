/**
 * Sales Routes
 * Handles all sales-related API endpoints
 */

import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();

export default async function salesRoutes(app, options) {
  /**
   * POST /api/sales
   * Create a new sale with sale items (All authenticated users)
   */
  app.post('/api/sales', { preHandler: authenticate }, async (request, reply) => {
    try {
      const {
        items,
        subtotal,
        discount,
        total,
        paymentType,
        cashAmount,
        changeAmount
      } = request.body;

      const userId = request.user.id; // Get userId from authenticated user

      // Validation
      if (!items || items.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Sale must have at least one item'
        });
      }

      if (!total || total <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid sale total'
        });
      }

      // Create sale with items in a transaction
      const sale = await prisma.$transaction(async (tx) => {
        // Create the sale with userId
        const newSale = await tx.sale.create({
          data: {
            userId, // Add userId here
            total: parseFloat(total),
            items: {
              create: items.map(item => ({
                productId: item.id || item.productId,
                quantity: parseInt(item.qty || item.quantity),
                price: parseFloat(item.price)
              }))
            }
          },
          include: {
            items: {
              include: {
                product: true
              }
            },
            user: {
              select: {
                id: true,
                username: true,
                fullName: true
              }
            }
          }
        });

        // Create payment record
        await tx.payment.create({
          data: {
            saleId: newSale.id,
            amount: cashAmount ? parseFloat(cashAmount) : parseFloat(total),
            paymentMethod: paymentType || 'cash',
            reference: paymentType === 'cash' ? null : `${paymentType}-${Date.now()}`
          }
        });

        // Update product quantities and create stock movements
        for (const item of items) {
          const productId = item.id || item.productId;
          const quantity = parseInt(item.qty || item.quantity);

          await tx.product.update({
            where: { id: productId },
            data: {
              quantity: {
                decrement: quantity
              }
            }
          });

          // Create stock movement record
          await tx.stockMovement.create({
            data: {
              productId: productId,
              quantity: -quantity,
              type: 'sale',
              reason: `Sale #${newSale.id}`
            }
          });
        }

        return newSale;
      });

      return reply.status(201).send({
        success: true,
        data: sale,
        message: 'Sale completed successfully'
      });
    } catch (error) {
      app.log.error('Error creating sale:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to complete sale',
        details: error.message
      });
    }
  });

  /**
   * GET /api/sales
   * Fetch all sales with optional filters (All authenticated users)
   */
  app.get('/api/sales', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { startDate, endDate, limit = 50 } = request.query;

      const where = {};
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      const sales = await prisma.sale.findMany({
        where,
        include: {
          items: {
            include: {
              product: true
            }
          },
          payments: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit)
      });

      return reply.send({
        success: true,
        data: sales
      });
    } catch (error) {
      app.log.error('Error fetching sales:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch sales'
      });
    }
  });

  /**
   * GET /api/sales/:id
   * Fetch single sale by ID (All authenticated users)
   */
  app.get('/api/sales/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params;

      const sale = await prisma.sale.findUnique({
        where: { id: parseInt(id) },
        include: {
          items: {
            include: {
              product: true
            }
          },
          payments: true
        }
      });

      if (!sale) {
        return reply.status(404).send({
          success: false,
          error: 'Sale not found'
        });
      }

      return reply.send({
        success: true,
        data: sale
      });
    } catch (error) {
      app.log.error('Error fetching sale:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch sale'
      });
    }
  });

  /**
   * GET /api/sales/daily-summary
   * Get today's sales summary
   */
  app.get('/api/sales/daily-summary', async (request, reply) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [sales, totalStats] = await Promise.all([
        prisma.sale.findMany({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          },
          include: {
            items: true
          }
        }),
        prisma.sale.aggregate({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          },
          _sum: {
            total: true
          },
          _count: true
        })
      ]);

      const itemCount = sales.reduce((sum, sale) => {
        return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0);

      return reply.send({
        success: true,
        data: {
          date: today.toISOString().split('T')[0],
          totalSales: totalStats._sum.total || 0,
          transactionCount: totalStats._count,
          itemsSold: itemCount
        }
      });
    } catch (error) {
      app.log.error('Error fetching daily summary:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch daily summary'
      });
    }
  });
}
