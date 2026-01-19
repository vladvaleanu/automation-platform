/**
 * Shared Middleware
 * Reusable middleware functions for documentation manager routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Add JWT authentication hook to a Fastify plugin
 * Verifies the JWT token on every request and sends 401 if invalid
 */
export function registerAuthHook(app: FastifyInstance): void {
    app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({
                success: false,
                error: { message: 'Unauthorized - Invalid or missing token', statusCode: 401 },
            });
        }
    });
}

/**
 * Get authenticated user ID from request
 * Should only be called after auth hook has run
 */
export function getUserId(request: FastifyRequest): string {
    return request.user.userId;
}

/**
 * Get full authenticated user from request
 */
export function getUser(request: FastifyRequest) {
    return request.user;
}
