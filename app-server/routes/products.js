/**
 * Product Routes
 * Handles all product-related API endpoints
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function productRoutes(app, options) {
  /**
   * GET /api/products
   * Fetch all active products
   */
  app.get('/api/products', async (request, reply) => {
    try {
      const products = await prisma.product.findMany({
        where: {
          isActive: true
        },
        include: {
          category: true,
          supplier: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return reply.send({
        success: true,
        data: products
      });
    } catch (error) {
      app.log.error('Error fetching products:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch products'
      });
    }
  });

  /**
   * GET /api/products/:id
   * Fetch single product by ID
   */
  app.get('/api/products/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: {
          category: true,
          supplier: true
        }
      });

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: 'Product not found'
        });
      }

      return reply.send({
        success: true,
        data: product
      });
    } catch (error) {
      app.log.error('Error fetching product:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch product'
      });
    }
  });

  /**
   * POST /api/products
   * Create a new product
   */
  app.post('/api/products', async (request, reply) => {
    try {
      const {
        name,
        sku,
        description,
        barcode,
        costPrice,
        sellingPrice,
        quantity,
        reorderLevel,
        categoryId,
        supplierId
      } = request.body;

      // Validation
      if (!name || !costPrice || !sellingPrice) {
        return reply.status(400).send({
          success: false,
          error: 'Name, cost price, and selling price are required'
        });
      }

      const product = await prisma.product.create({
        data: {
          name,
          sku,
          description,
          barcode,
          costPrice: parseFloat(costPrice),
          sellingPrice: parseFloat(sellingPrice),
          quantity: quantity ? parseInt(quantity) : 0,
          reorderLevel: reorderLevel ? parseInt(reorderLevel) : 10,
          categoryId: categoryId ? parseInt(categoryId) : null,
          supplierId: supplierId ? parseInt(supplierId) : null
        },
        include: {
          category: true,
          supplier: true
        }
      });

      return reply.status(201).send({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      app.log.error('Error creating product:', error);
      
      // Handle unique constraint violations
      if (error.code === 'P2002') {
        return reply.status(400).send({
          success: false,
          error: 'Product with this SKU or barcode already exists'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Failed to create product'
      });
    }
  });

  /**
   * PUT /api/products/:id
   * Update an existing product
   */
  app.put('/api/products/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const {
        name,
        sku,
        description,
        barcode,
        costPrice,
        sellingPrice,
        quantity,
        reorderLevel,
        categoryId,
        supplierId,
        isActive
      } = request.body;

      const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          name,
          sku,
          description,
          barcode,
          costPrice: costPrice ? parseFloat(costPrice) : undefined,
          sellingPrice: sellingPrice ? parseFloat(sellingPrice) : undefined,
          quantity: quantity !== undefined ? parseInt(quantity) : undefined,
          reorderLevel: reorderLevel !== undefined ? parseInt(reorderLevel) : undefined,
          categoryId: categoryId ? parseInt(categoryId) : null,
          supplierId: supplierId ? parseInt(supplierId) : null,
          isActive: isActive !== undefined ? isActive : undefined
        },
        include: {
          category: true,
          supplier: true
        }
      });

      return reply.send({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      app.log.error('Error updating product:', error);
      
      if (error.code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: 'Product not found'
        });
      }
      
      if (error.code === 'P2002') {
        return reply.status(400).send({
          success: false,
          error: 'Product with this SKU or barcode already exists'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Failed to update product'
      });
    }
  });

  /**
   * DELETE /api/products/:id
   * Soft delete a product (set isActive to false)
   */
  app.delete('/api/products/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          isActive: false
        }
      });

      return reply.send({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      app.log.error('Error deleting product:', error);
      
      if (error.code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: 'Product not found'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete product'
      });
    }
  });

  /**
   * GET /api/products/search/:query
   * Search products by name or barcode
   */
  app.get('/api/products/search/:query', async (request, reply) => {
    try {
      const { query } = request.params;

      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { barcode: { contains: query } },
            { sku: { contains: query } }
          ]
        },
        include: {
          category: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return reply.send({
        success: true,
        data: products
      });
    } catch (error) {
      app.log.error('Error searching products:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to search products'
      });
    }
  });
}
