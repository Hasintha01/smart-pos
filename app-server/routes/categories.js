/**
 * Category Routes
 * Handles category CRUD operations
 */

import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const prisma = new PrismaClient();

export default async function categoryRoutes(app, options) {
  /**
   * GET /api/categories
   * Get all categories
   */
  app.get('/api/categories', { preHandler: authenticate }, async (request, reply) => {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      console.error('Get categories error:', error);
      reply.code(500);
      return {
        success: false,
        message: 'Failed to fetch categories'
      };
    }
  });

  /**
   * GET /api/categories/:id
   * Get single category
   */
  app.get('/api/categories/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params;

      const category = await prisma.category.findUnique({
        where: { id: parseInt(id) },
        include: {
          products: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              barcode: true,
              sellingPrice: true,
              stockQuantity: true
            }
          }
        }
      });

      if (!category) {
        reply.code(404);
        return {
          success: false,
          message: 'Category not found'
        };
      }

      return {
        success: true,
        data: category
      };
    } catch (error) {
      console.error('Get category error:', error);
      reply.code(500);
      return {
        success: false,
        message: 'Failed to fetch category'
      };
    }
  });

  /**
   * POST /api/categories
   * Create new category (Admin/Manager only)
   */
  app.post('/api/categories', { 
    preHandler: [authenticate, authorize('ADMIN', 'MANAGER')] 
  }, async (request, reply) => {
    try {
      const { name, description } = request.body;

      // Validation
      if (!name || name.trim() === '') {
        reply.code(400);
        return {
          success: false,
          message: 'Category name is required'
        };
      }

      // Check for duplicate name
      const existing = await prisma.category.findUnique({
        where: { name: name.trim() }
      });

      if (existing) {
        reply.code(400);
        return {
          success: false,
          message: 'Category with this name already exists'
        };
      }

      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null
        }
      });

      return {
        success: true,
        message: 'Category created successfully',
        data: category
      };
    } catch (error) {
      console.error('Create category error:', error);
      reply.code(500);
      return {
        success: false,
        message: 'Failed to create category'
      };
    }
  });

  /**
   * PUT /api/categories/:id
   * Update category (Admin/Manager only)
   */
  app.put('/api/categories/:id', { 
    preHandler: [authenticate, authorize('ADMIN', 'MANAGER')] 
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description } = request.body;

      // Validation
      if (!name || name.trim() === '') {
        reply.code(400);
        return {
          success: false,
          message: 'Category name is required'
        };
      }

      // Check if category exists
      const existing = await prisma.category.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existing) {
        reply.code(404);
        return {
          success: false,
          message: 'Category not found'
        };
      }

      // Check for duplicate name (excluding current category)
      const duplicate = await prisma.category.findFirst({
        where: {
          name: name.trim(),
          id: { not: parseInt(id) }
        }
      });

      if (duplicate) {
        reply.code(400);
        return {
          success: false,
          message: 'Category with this name already exists'
        };
      }

      const category = await prisma.category.update({
        where: { id: parseInt(id) },
        data: {
          name: name.trim(),
          description: description?.trim() || null
        }
      });

      return {
        success: true,
        message: 'Category updated successfully',
        data: category
      };
    } catch (error) {
      console.error('Update category error:', error);
      reply.code(500);
      return {
        success: false,
        message: 'Failed to update category'
      };
    }
  });

  /**
   * DELETE /api/categories/:id
   * Soft delete category (Admin only)
   */
  app.delete('/api/categories/:id', { 
    preHandler: [authenticate, authorize('ADMIN')] 
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      if (!category) {
        reply.code(404);
        return {
          success: false,
          message: 'Category not found'
        };
      }

      // Check if category has active products
      if (category._count.products > 0) {
        reply.code(400);
        return {
          success: false,
          message: `Cannot delete category with ${category._count.products} active product(s). Please reassign or delete products first.`
        };
      }

      // Soft delete
      await prisma.category.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });

      return {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error) {
      console.error('Delete category error:', error);
      reply.code(500);
      return {
        success: false,
        message: 'Failed to delete category'
      };
    }
  });
}
