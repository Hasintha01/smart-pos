/**
 * Authentication Middleware
 * Middleware functions for authentication and authorization
 */

import { verifyToken } from '../utils/auth.js';

/**
 * Fastify hook for authentication
 * Extracts token from cookies or Authorization header
 */
export async function authenticate(request, reply) {
  // Try to get token from cookie or Authorization header
  const token = request.cookies?.token || request.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return reply.status(401).send({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return reply.status(401).send({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }

  request.user = decoded; // Attach user info to request
}

/**
 * Fastify hook for authorization
 * @param {...string} roles - Allowed roles (ADMIN, MANAGER, CASHIER)
 */
export function authorize(...roles) {
  return async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ 
        success: false, 
        message: 'User not authenticated.' 
      });
    }

    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
  };
}
