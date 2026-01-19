/**
 * Response Utilities
 * Standardized response helpers for consistent API responses
 */

import { FastifyReply } from 'fastify';

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
    };
}

export interface ApiErrorResponse {
    success: false;
    error: {
        message: string;
        statusCode: number;
        details?: unknown;
    };
}

/**
 * Send a success response
 */
export function sendSuccess<T>(reply: FastifyReply, data: T, meta?: ApiSuccessResponse['meta']): void {
    const response: ApiSuccessResponse<T> = { success: true, data };
    if (meta) response.meta = meta;
    reply.send(response);
}

/**
 * Send a created (201) response
 */
export function sendCreated<T>(reply: FastifyReply, data: T): void {
    reply.status(201).send({ success: true, data } as ApiSuccessResponse<T>);
}

/**
 * Send an error response
 */
export function sendError(reply: FastifyReply, statusCode: number, message: string, details?: unknown): void {
    const response: ApiErrorResponse = {
        success: false,
        error: { message, statusCode }
    };
    if (details) response.error.details = details;
    reply.status(statusCode).send(response);
}

/**
 * Send a 400 Bad Request error
 */
export function sendBadRequest(reply: FastifyReply, message: string): void {
    sendError(reply, 400, message);
}

/**
 * Send a 403 Forbidden error
 */
export function sendForbidden(reply: FastifyReply, message = 'Insufficient permissions'): void {
    sendError(reply, 403, message);
}

/**
 * Send a 404 Not Found error
 */
export function sendNotFound(reply: FastifyReply, message = 'Resource not found'): void {
    sendError(reply, 404, message);
}

/**
 * Send a 500 Internal Server Error
 */
export function sendServerError(reply: FastifyReply, message = 'Internal server error'): void {
    sendError(reply, 500, message);
}
