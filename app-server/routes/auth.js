/**
 * Authentication Routes
 * Handles user registration, login, and token management
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { authenticate, authorize } from '../middleware/auth.js';

const prisma = new PrismaClient();

export default async function authRoutes(app) {

  /**
   * POST /api/auth/register
   * Register a new user (Admin only)
   */
  app.post('/api/auth/register', { preHandler: [authenticate, authorize('ADMIN')] }, async (request, reply) => {
    try {
      const { username, password, fullName, role } = request.body;

      // Validate required fields
      if (!username || !password || !fullName) {
        return reply.status(400).send({ 
          success: false, 
          message: 'Username, password, and full name are required.' 
        });
      }

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUser) {
        return reply.status(400).send({ 
          success: false, 
          message: 'Username already exists.' 
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          fullName,
          role: role || 'CASHIER'
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      return reply.status(201).send({ 
        success: true, 
        message: 'User created successfully.',
        data: user 
      });
    } catch (error) {
      app.log.error('Register error:', error);
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to register user.' 
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

      // Validation
      if (!username || !password) {
        return reply.status(400).send({ 
          success: false, 
          message: 'Username and password are required.' 
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { username }
      });

      if (!user || !user.isActive) {
        return reply.status(401).send({ 
          success: false, 
          message: 'Invalid username or password.' 
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return reply.status(401).send({ 
          success: false, 
          message: 'Invalid username or password.' 
        });
      }

      // Generate token
      const token = generateToken(user);

      // Set cookie
      reply.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in milliseconds
      });

      // Return user info (without password)
      return reply.send({
        success: true,
        message: 'Login successful.',
        data: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          token
        }
      });
    } catch (error) {
      app.log.error('Login error:', error);
      return reply.status(500).send({ 
        success: false, 
        message: 'Login failed.' 
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Clear authentication token
   */
  app.post('/api/auth/logout', (request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return reply.send({ 
      success: true, 
      message: 'Logged out successfully.' 
    });
  });

  /**
   * GET /api/auth/me
   * Get current user information (requires authentication)
   */
  app.get('/api/auth/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      if (!user) {
        return reply.status(404).send({ 
          success: false, 
          message: 'User not found.' 
        });
      }

      return reply.send({ 
        success: true, 
        data: user 
      });
    } catch (error) {
      app.log.error('Get user error:', error);
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get user info.' 
      });
    }
  });
}
