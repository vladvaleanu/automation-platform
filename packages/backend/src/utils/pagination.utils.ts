/**
 * Pagination Utilities
 * Common functions for handling pagination across routes
 */

import { PAGINATION } from '../config/constants.js';

/**
 * Pagination parameters parsed from query string
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Parse pagination parameters from query object
 * @param query Query object with page and limit as strings
 * @returns Parsed pagination parameters with skip calculated
 */
export function parsePagination(query: { page?: string; limit?: string }): PaginationParams {
  const page = query.page ? parseInt(query.page, 10) : PAGINATION.DEFAULT_PAGE;
  const limit = query.limit ? parseInt(query.limit, 10) : PAGINATION.DEFAULT_LIMIT;

  // Validate and clamp values
  const validPage = Math.max(page, PAGINATION.DEFAULT_PAGE);
  const validLimit = Math.min(
    Math.max(limit, PAGINATION.MIN_LIMIT),
    PAGINATION.MAX_LIMIT
  );

  const skip = (validPage - 1) * validLimit;

  return {
    page: validPage,
    limit: validLimit,
    skip,
  };
}

/**
 * Create pagination metadata for responses
 * @param page Current page number
 * @param limit Items per page
 * @param total Total number of items
 * @returns Pagination metadata object
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Validate pagination parameters
 * @param page Page number
 * @param limit Items per page
 * @throws Error if parameters are invalid
 */
export function validatePagination(page: number, limit: number): void {
  if (page < PAGINATION.DEFAULT_PAGE) {
    throw new Error(`Page must be at least ${PAGINATION.DEFAULT_PAGE}`);
  }

  if (limit < PAGINATION.MIN_LIMIT) {
    throw new Error(`Limit must be at least ${PAGINATION.MIN_LIMIT}`);
  }

  if (limit > PAGINATION.MAX_LIMIT) {
    throw new Error(`Limit must not exceed ${PAGINATION.MAX_LIMIT}`);
  }
}
