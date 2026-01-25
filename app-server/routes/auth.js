/**
 * Authentication Routes
 * Handles user registration, login, and token management
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';

const prisma = new PrismaClient();

/**
 * Register authentication routes
 * @param {FastifyInstance} app - Fastify app instance
 */
export default async function authRoutes(app) {
  
  /**
   * POST /api/auth/register
   * Register a new user (Admin only in production)
   */
  app.post('/api/auth/register', async (request, reply) => {
    try {
      const { username, email, password, fullName, roleId } = request.body;

      // Validate required fields
      if (!username || !password || !roleId) {
        return reply.status(400).send({
          error: 'Username, password, and roleId are required'
        });
      }

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUser) {
        return reply.status(409).send({
          error: 'Username already exists'
        });
      }

      // Check if email already exists (if provided)
      if (email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email }
        });

        if (existingEmail) {
          return reply.status(409).send({
            error: 'Email already exists'
          });
        }
      }

      // Verify role exists
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        return reply.status(400).send({
          error: 'Invalid role ID'
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          fullName,
          roleId,
          isActive: true
        },
        include: {
          role: true
        }
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return reply.status(201).send({
        message: 'User registered successfully',
        user: userWithoutPassword
      });

    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({
        error: 'Failed to register user'
      });
    }
  });

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  app.post('/api/auth/login', async (request, reply) => {
    try {
      const { username, password } = request.body;

      // Validate required fields
      if (!username || !password) {
        return reply.status(400).send({
          error: 'Username and password are required'
        });
      }

      // Find user by username
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          role: true
        }
      });

      // Check if user exists
      if (!user) {
        return reply.status(401).send({
          error: 'Invalid username or password'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return reply.status(403).send({
          error: 'Account is disabled'
        });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return reply.status(401).send({
          error: 'Invalid username or password'
        });
      }

      // Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate JWT token
      const token = generateToken(user);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return reply.send({
        message: 'Login successful',
        token,
        user: userWithoutPassword
      });

    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({
        error: 'Login failed'
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user information (requires authentication)
   */
  app.get('/api/auth/me', async (request, reply) => {
    try {
      // This will be protected by auth middleware later
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          error: 'No token provided'
        });
      }

      const token = authHeader.substring(7);
      const { verifyToken } = await import('../utils/auth.js');
      const decoded = verifyToken(token);

      if (!decoded) {
        return reply.status(401).send({
          error: 'Invalid or expired token'
        });
      }

      // Get fresh user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          role: true
        }
      });

      if (!user || !user.isActive) {
        return reply.status(404).send({
          error: 'User not found or inactive'
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return reply.send({
        user: userWithoutPassword
      });

    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get user information'
      });
    }
  });

  /**
   * GET /api/auth/roles
   * Get all available roles
   */
  app.get('/api/auth/roles', async (request, reply) => {
    try {
      const roles = await prisma.role.findMany({
        select: {
          id: true,
          name: true,
          description: true
        }
      });

      return reply.send({ roles });

    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({
        error: 'Failed to fetch roles'
      });
    }
  });
}
