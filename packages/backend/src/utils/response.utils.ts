/**
 * Response Utilities
 * Common functions for creating standardized API responses
 */

import type { PaginationMeta } from './pagination.utils.js';

/**
 * Success response without pagination
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Success response with pagination
 */
export interface PaginatedSuccessResponse<T> {
  success: true;
  data: T;
  pagination: PaginationMeta;
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  error: string | object;
}

/**
 * Create a success response
 * @param data Response data
 * @returns Standardized success response
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create a paginated success response
 * @param data Response data (array of items)
 * @param pagination Pagination metadata
 * @returns Standardized paginated success response
 */
export function createPaginatedResponse<T>(
  data: T,
  pagination: PaginationMeta
): PaginatedSuccessResponse<T> {
  return {
    success: true,
    data,
    pagination,
  };
}

/**
 * Create an error response
 * @param error Error message or object
 * @returns Standardized error response
 */
export function createErrorResponse(error: string | object): ErrorResponse {
  return {
    success: false,
    error,
  };
}
