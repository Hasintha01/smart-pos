/**
 * Smart POS Backend Server
 * Main entry point for the Fastify API server
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import dashboardRoutes from './routes/dashboard.js';

// Initialize Fastify instance with logging enabled for development
const app = Fastify({
  logger: true
});

// Enable CORS to allow frontend to communicate with backend
await app.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Vite dev server ports
  credentials: true
});

// Register cookie parser
await app.register(cookie);

// Register routes
await app.register(authRoutes);
await app.register(productRoutes);
await app.register(salesRoutes);
await app.register(dashboardRoutes);

/**
 * Health check endpoint
 * Returns the status of the API server
 */
app.get('/health', async (request, reply) => {
  return { 
    status: 'POS API Running',
    timestamp: new Date().toISOString()
  };
});

/**
 * Root endpoint
 * Basic welcome message
 */
app.get('/', async (request, reply) => {
  return { 
    message: 'Smart POS API',
    version: '1.0.0'
  };
});

/**
 * Start the server
 * Listen on port 3001
 */
const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
