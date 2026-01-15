/**
 * Query Utilities
 * Common functions for building database queries
 */

/**
 * Build a where clause with optional filters
 * Filters out undefined/null values automatically
 * @param filters Object with potential filter values
 * @returns Clean where object with only defined values
 */
export function buildWhereClause<T extends Record<string, any>>(filters: T): Partial<T> {
  const where: Partial<T> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      where[key as keyof T] = value;
    }
  }

  return where;
}

/**
 * Parse boolean from string query parameter
 * @param value String value ('true' or 'false')
 * @returns Boolean or undefined
 */
export function parseBoolean(value?: string): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return value === 'true';
}

/**
 * Parse date range from query parameters
 * @param since ISO date string for start of range
 * @param until ISO date string for end of range
 * @returns Prisma date range filter or undefined
 */
export function parseDateRange(
  since?: string,
  until?: string
): { gte?: Date; lte?: Date } | undefined {
  const range: { gte?: Date; lte?: Date } = {};

  if (since) {
    range.gte = new Date(since);
  }

  if (until) {
    range.lte = new Date(until);
  }

  return Object.keys(range).length > 0 ? range : undefined;
}

/**
 * Build orderBy clause from sort parameter
 * @param sort Sort string in format "field:direction" (e.g., "createdAt:desc")
 * @param defaultSort Default sort if none provided
 * @returns Prisma orderBy object
 */
export function buildOrderBy(
  sort?: string,
  defaultSort: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }
): Record<string, 'asc' | 'desc'> {
  if (!sort) {
    return defaultSort;
  }

  const [field, direction] = sort.split(':');

  if (!field || !direction || (direction !== 'asc' && direction !== 'desc')) {
    return defaultSort;
  }

  return { [field]: direction };
}

/**
 * Sanitize search string for SQL LIKE/contains queries
 * Removes special characters that could cause issues
 * @param search Raw search string
 * @returns Sanitized search string
 */
export function sanitizeSearch(search?: string): string | undefined {
  if (!search) {
    return undefined;
  }

  // Remove potentially dangerous characters, keep alphanumeric, spaces, and basic punctuation
  return search.replace(/[^\w\s\-_.@]/g, '').trim();
}
