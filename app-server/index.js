/**
 * Smart POS Backend Server
 * Main entry point for the Fastify API server
 */

import Fastify from 'fastify';

// Initialize Fastify instance with logging enabled for development
const app = Fastify({
  logger: true
});

// Enable CORS to allow frontend to communicate with backend
await app.register(import('@fastify/cors'), {
  origin: 'http://localhost:5173', // Vite dev server default port
  credentials: true
});

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
