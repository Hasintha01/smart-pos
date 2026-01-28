/**
 * Reports Routes
 * Handles business intelligence and reporting endpoints
 */

import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();

export default async function reportsRoutes(app, options) {
  
  /**
   * GET /api/reports/sales-summary
   * Get sales summary by date range
   */
  app.get('/api/reports/sales-summary', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.query;

      if (!startDate || !endDate) {
        return reply.code(400).send({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Get all sales in date range
      const sales = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  costPrice: true
                }
              }
            }
          },
          user: {
            select: {
              fullName: true,
              username: true
            }
          },
          payments: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calculate summary metrics
      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalTransactions = sales.length;
      
      const totalProfit = sales.reduce((sum, sale) => {
        const saleProfit = sale.items.reduce((itemSum, item) => {
          const costPrice = item.product.costPrice || 0;
          const profit = (item.price - costPrice) * item.quantity;
          return itemSum + profit;
        }, 0);
        return sum + saleProfit;
      }, 0);

      const totalItemsSold = sales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );

      return {
        success: true,
        data: {
          summary: {
            totalSales,
            totalTransactions,
            totalProfit,
            totalItemsSold,
            averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0
          },
          sales
        }
      };
    } catch (error) {
      console.error('Sales summary error:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to generate sales summary'
      });
    }
  });

  /**
   * GET /api/reports/sales-by-product
   * Get sales breakdown by product
   */
  app.get('/api/reports/sales-by-product', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.query;

      if (!startDate || !endDate) {
        return reply.code(400).send({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Get all sale items in date range
      const saleItems = await prisma.saleItem.findMany({
        where: {
          sale: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              costPrice: true,
              category: {
                select: {
                  name: true
                }
              }
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
          existing.quantitySold += item.quantity;
          existing.revenue += item.price * item.quantity;
          existing.profit += (item.price - (item.product.costPrice || 0)) * item.quantity;
        } else {
          productMap.set(productId, {
            productId,
            productName: item.product.name,
            barcode: item.product.barcode,
            category: item.product.category?.name || 'Uncategorized',
            quantitySold: item.quantity,
            revenue: item.price * item.quantity,
            profit: (item.price - (item.product.costPrice || 0)) * item.quantity,
            costPrice: item.product.costPrice
          });
        }
      });

      // Convert to array and sort by revenue
      const productSales = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue);

      return {
        success: true,
        data: productSales
      };
    } catch (error) {
      console.error('Sales by product error:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to generate product sales report'
      });
    }
  });

  /**
   * GET /api/reports/sales-by-cashier
   * Get sales performance by cashier/user
   */
  app.get('/api/reports/sales-by-cashier', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.query;

      if (!startDate || !endDate) {
        return reply.code(400).send({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Get all sales with user info
      const sales = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end
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
          },
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              role: true
            }
          }
        }
      });

      // Aggregate by user
      const userMap = new Map();

      sales.forEach(sale => {
        const userId = sale.userId;
        const profit = sale.items.reduce((sum, item) => {
          const costPrice = item.product.costPrice || 0;
          return sum + (item.price - costPrice) * item.quantity;
        }, 0);

        if (userMap.has(userId)) {
          const existing = userMap.get(userId);
          existing.totalSales += sale.total;
          existing.totalProfit += profit;
          existing.transactionCount += 1;
        } else {
          userMap.set(userId, {
            userId,
            userName: sale.user.fullName,
            username: sale.user.username,
            role: sale.user.role,
            totalSales: sale.total,
            totalProfit: profit,
            transactionCount: 1
          });
        }
      });

      // Convert to array and sort by total sales
      const cashierPerformance = Array.from(userMap.values())
        .sort((a, b) => b.totalSales - a.totalSales);

      return {
        success: true,
        data: cashierPerformance
      };
    } catch (error) {
      console.error('Sales by cashier error:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to generate cashier performance report'
      });
    }
  });

  /**
   * GET /api/reports/payment-methods
   * Get sales breakdown by payment method
   */
  app.get('/api/reports/payment-methods', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.query;

      if (!startDate || !endDate) {
        return reply.code(400).send({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Get all payments in date range
      const payments = await prisma.payment.findMany({
        where: {
          sale: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        },
        include: {
          sale: {
            select: {
              id: true,
              total: true,
              createdAt: true
            }
          }
        }
      });

      // Aggregate by payment method
      const methodMap = new Map();

      payments.forEach(payment => {
        const method = payment.paymentMethod;
        if (methodMap.has(method)) {
          const existing = methodMap.get(method);
          existing.totalAmount += payment.amount;
          existing.count += 1;
        } else {
          methodMap.set(method, {
            paymentMethod: method,
            totalAmount: payment.amount,
            count: 1
          });
        }
      });

      // Convert to array and sort by total amount
      const paymentBreakdown = Array.from(methodMap.values())
        .sort((a, b) => b.totalAmount - a.totalAmount);

      const totalAmount = paymentBreakdown.reduce((sum, item) => sum + item.totalAmount, 0);

      // Add percentage
      paymentBreakdown.forEach(item => {
        item.percentage = totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0;
      });

      return {
        success: true,
        data: {
          breakdown: paymentBreakdown,
          total: totalAmount
        }
      };
    } catch (error) {
      console.error('Payment methods error:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to generate payment methods report'
      });
    }
  });

  /**
   * GET /api/reports/profit-analysis
   * Get detailed profit analysis
   */
  app.get('/api/reports/profit-analysis', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.query;

      if (!startDate || !endDate) {
        return reply.code(400).send({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Get all sales in date range
      const sales = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  costPrice: true,
                  category: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      let totalRevenue = 0;
      let totalCost = 0;
      let totalProfit = 0;
      const categoryProfits = new Map();

      sales.forEach(sale => {
        sale.items.forEach(item => {
          const revenue = item.price * item.quantity;
          const cost = (item.product.costPrice || 0) * item.quantity;
          const profit = revenue - cost;
          const category = item.product.category?.name || 'Uncategorized';

          totalRevenue += revenue;
          totalCost += cost;
          totalProfit += profit;

          if (categoryProfits.has(category)) {
            const existing = categoryProfits.get(category);
            existing.revenue += revenue;
            existing.cost += cost;
            existing.profit += profit;
          } else {
            categoryProfits.set(category, {
              category,
              revenue,
              cost,
              profit,
              margin: 0
            });
          }
        });
      });

      // Calculate margins
      const categoryBreakdown = Array.from(categoryProfits.values()).map(cat => ({
        ...cat,
        margin: cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0
      })).sort((a, b) => b.profit - a.profit);

      return {
        success: true,
        data: {
          summary: {
            totalRevenue,
            totalCost,
            totalProfit,
            profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
          },
          categoryBreakdown
        }
      };
    } catch (error) {
      console.error('Profit analysis error:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to generate profit analysis'
      });
    }
  });
}
