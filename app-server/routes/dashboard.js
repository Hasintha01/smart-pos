/**
 * Dashboard Routes
 * Handles dashboard statistics and analytics endpoints
 */

import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();

export default async function dashboardRoutes(app, options) {
  /**
   * GET /api/dashboard/stats
   * Get dashboard statistics - today's sales, profit, inventory status
   */
  app.get('/api/dashboard/stats', { preHandler: authenticate }, async (request, reply) => {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Today's sales
      const todaySales = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  costPrice: true
                }
              }
            }
          }
        }
      });

      // Calculate today's metrics
      const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
      const todayItemsSold = todaySales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      
      // Calculate today's profit (selling price - cost price)
      const todayProfit = todaySales.reduce((sum, sale) => {
        const saleProfit = sale.items.reduce((itemSum, item) => {
          const costPrice = item.product.costPrice || 0;
          const profit = (item.price - costPrice) * item.quantity;
          return itemSum + profit;
        }, 0);
        return sum + saleProfit;
      }, 0);

      // Get low stock count (items at or below reorder level)
      const allProducts = await prisma.product.findMany({
        select: {
          stockQuantity: true,
          reorderLevel: true
        }
      });

      const lowStockCount = allProducts.filter(p => 
        p.stockQuantity > 0 && p.stockQuantity <= p.reorderLevel
      ).length;

      // Get out of stock count
      const outOfStockCount = await prisma.product.count({
        where: { stockQuantity: 0 }
      });

      // Total products
      const totalProducts = await prisma.product.count();

      // Total sales (all time)
      const totalSales = await prisma.sale.count();

      return {
        success: true,
        data: {
          today: {
            sales: todayTotal,
            profit: todayProfit,
            itemsSold: todayItemsSold,
            transactions: todaySales.length
          },
          inventory: {
            totalProducts,
            lowStock: lowStockCount,
            outOfStock: outOfStockCount
          },
          overall: {
            totalSales
          }
        }
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      reply.code(500);
      return {
        success: false,
        message: 'Failed to fetch dashboard statistics'
      };
    }
  });

  /**
   * GET /api/dashboard/recent-sales
   * Get recent sales with pagination
   */
  app.get('/api/dashboard/recent-sales', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { limit = 10 } = request.query;

      const recentSales = await prisma.sale.findMany({
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              fullName: true,
              username: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  barcode: true
                }
              }
            }
          }
        }
      });

      return {
        success: true,
        data: recentSales
      };
    } catch (error) {
      console.error('Recent sales error:', error);
      reply.code(500);
      return {
        success: false,
        message: 'Failed to fetch recent sales'
      };
    }
  });

  /**
   * GET /api/dashboard/top-products
   * Get best-selling products
   */
  app.get('/api/dashboard/top-products', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { limit = 10, period = 'all' } = request.query;

      let dateFilter = {};
      if (period === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateFilter = {
          sale: {
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          }
        };
      } else if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = {
          sale: {
            createdAt: {
              gte: weekAgo
            }
          }
        };
      } else if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = {
          sale: {
            createdAt: {
              gte: monthAgo
            }
          }
        };
      }

      // Get all sale items with date filter
      const saleItems = await prisma.saleItem.findMany({
        where: dateFilter,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              sellingPrice: true,
              category: true
            }
          }
        }
      });

      // Aggregate by product
      const productMap = new Map();
      saleItems.forEach(item => {
        const productId = item.productId;
        if (productMap.has(productId)) {
          const existing = productMap.get(productId);
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += item.total;
        } else {
          productMap.set(productId, {
            product: item.product,
            totalQuantity: item.quantity,
            totalRevenue: item.total
          });
        }
      });

      // Convert to array and sort by quantity
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, parseInt(limit));

      return {
        success: true,
        data: topProducts
      };
    } catch (error) {
      console.error('Top products error:', error);
      reply.code(500);
      return {
        success: false,
        message: 'Failed to fetch top products'
      };
    }
  });

  /**
   * GET /api/dashboard/sales-trend
   * Get sales trend data for the past N days
   */
  app.get('/api/dashboard/sales-trend', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { days = 7 } = request.query;
      const numDays = parseInt(days);
      
      const salesByDay = [];
      const today = new Date();
      
      for (let i = numDays - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const daySales = await prisma.sale.findMany({
          where: {
            createdAt: {
              gte: date,
              lt: nextDay
            }
          }
        });
        
        const total = daySales.reduce((sum, sale) => sum + sale.total, 0);
        const count = daySales.length;
        
        salesByDay.push({
          date: date.toISOString().split('T')[0],
          total,
          count,
          average: count > 0 ? total / count : 0
        });
      }
      
      return {
        success: true,
        data: salesByDay
      };
    } catch (error) {
      console.error('Sales trend error:', error);
      reply.code(500);
      return {
        success: false,
        message: 'Failed to fetch sales trend'
      };
    }
  });
}
