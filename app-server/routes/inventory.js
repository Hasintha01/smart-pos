import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();

export default async function inventoryRoutes(app, options) {
  // Get inventory summary
  app.get('/api/inventory/summary', { preHandler: authenticate }, async (request, reply) => {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          barcode: true,
          stockQuantity: true,
          reorderLevel: true,
          category: {
            select: { name: true }
          },
          sellingPrice: true,
          updatedAt: true
        },
        orderBy: { stockQuantity: 'asc' } // Low stock first
      });

      // Format category name
      const formattedProducts = products.map(p => ({
        ...p,
        category: p.category?.name || 'Uncategorized'
      }));

      // Calculate stats
      const totalProducts = products.length;
      const outOfStock = products.filter(p => p.stockQuantity === 0).length;
      const lowStock = products.filter(
        p => p.stockQuantity > 0 && p.stockQuantity <= (p.reorderLevel || 10)
      ).length;
      const totalValue = products.reduce(
        (sum, p) => sum + (p.stockQuantity * p.sellingPrice), 
        0
      );

      return {
        success: true,
        data: {
          stats: {
            totalProducts,
            outOfStock,
            lowStock,
            totalValue
          },
          products: formattedProducts
        }
      };
    } catch (error) {
      console.error('Inventory summary error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch inventory summary'
      });
    }
  });

  // Update stock (Stock In / Stock Out)
  app.post('/api/inventory/movements', { preHandler: authenticate }, async (request, reply) => {
    const { productId, type, quantity, reason, reference } = request.body;
    const userId = request.user.id;

    // Validate input
    if (!productId || !type || !quantity || quantity <= 0) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid stock movement data'
      });
    }

    if (!['IN', 'OUT'].includes(type)) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid movement type'
      });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Get current product
        const product = await tx.product.findUnique({
          where: { id: parseInt(productId) }
        });

        if (!product) {
          throw new Error('Product not found');
        }

        // 2. Calculate new quantity
        let newStockQuantity = product.stockQuantity;
        
        if (type === 'IN') {
          newStockQuantity += parseInt(quantity);
        } else if (type === 'OUT') {
          if (product.stockQuantity < quantity) {
            throw new Error('Insufficient stock');
          }
          newStockQuantity -= parseInt(quantity);
        }

        // 3. Create stock movement record
        const movement = await tx.stockMovement.create({
          data: {
            productId: parseInt(productId),
            type,
            quantity: parseInt(quantity),
            reason: reason || `Manual Stock ${type}`,
            reference,
            userId: userId
          }
        });

        // 4. Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: parseInt(productId) },
          data: { stockQuantity: newStockQuantity }
        });

        return { movement, updatedProduct };
      });

      return {
        success: true,
        data: result,
        message: 'Stock updated successfully'
      };

    } catch (error) {
      // console.error('Stock movement error:', error); 
      // Commented out logging to keep terminal clean, but passing message to frontend
      const statusCode = error.message === 'Product not found' || error.message === 'Insufficient stock' ? 400 : 500;
      return reply.code(statusCode).send({
        success: false,
        error: error.message || 'Failed to update stock'
      });
    }
  });

  // Get stock movement history for a product
  app.get('/api/inventory/history/:productId', { preHandler: authenticate }, async (request, reply) => {
      const { productId } = request.params;
      try {
          const history = await prisma.stockMovement.findMany({
              where: { productId: parseInt(productId) },
              include: {
                  user: {
                      select: { name: true, username: true }
                  }
              },
              orderBy: { createdAt: 'desc' },
              take: 20
          });

          return {
              success: true,
              data: history
          }
      } catch (error) {
          console.error("History error: ", error);
          return reply.code(500).send({success: false, error: "Failed to fetch history"});
      }
  });
}
