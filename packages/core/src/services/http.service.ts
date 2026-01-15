/**
 * HTTP Service - Core
 * Provides HTTP client with retry logic, timeouts, and interceptors
 *
 * Features:
 * - Retry logic with exponential backoff
 * - Configurable timeouts
 * - Request/response interceptors
 * - Error handling and logging
 * - Support for all HTTP methods
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number; // Initial delay in ms
  headers?: Record<string, string>;
  validateStatus?: (status: number) => boolean;
}

export interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

// ============================================================================
// HTTP Service
// ============================================================================

export class HttpService {
  /**
   * Create a configured Axios instance
   */
  static createClient(config: HttpConfig = {}): AxiosInstance {
    const {
      baseURL,
      timeout = 30000,
      retries = 3,
      retryDelay = 1000,
      headers = {},
      validateStatus,
    } = config;

    const client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      validateStatus: validateStatus || ((status) => status >= 200 && status < 300),
    });

    // Add retry interceptor
    if (retries > 0) {
      this.addRetryInterceptor(client, { retries, retryDelay });
    }

    // Add logging interceptor (optional)
    this.addLoggingInterceptor(client);

    return client;
  }

  /**
   * Add retry logic with exponential backoff
   */
  private static addRetryInterceptor(
    client: AxiosInstance,
    retryConfig: RetryConfig
  ): void {
    client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config: any = error.config;

        // Initialize retry count
        if (!config.__retryCount) {
          config.__retryCount = 0;
        }

        // Check if we should retry
        const shouldRetry = this.shouldRetry(error, retryConfig);

        if (config.__retryCount >= retryConfig.retries || !shouldRetry) {
          return Promise.reject(error);
        }

        config.__retryCount += 1;

        // Calculate delay with exponential backoff
        const delay = retryConfig.retryDelay * Math.pow(2, config.__retryCount - 1);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry the request
        return client(config);
      }
    );
  }

  /**
   * Determine if request should be retried
   */
  private static shouldRetry(error: AxiosError, retryConfig: RetryConfig): boolean {
    // Use custom retry condition if provided
    if (retryConfig.retryCondition) {
      return retryConfig.retryCondition(error);
    }

    // Default retry conditions
    if (!error.response) {
      // Network errors, timeouts
      return true;
    }

    const status = error.response.status;

    // Retry on server errors (5xx) and rate limiting (429)
    return status >= 500 || status === 429;
  }

  /**
   * Add request/response logging interceptor
   */
  private static addLoggingInterceptor(client: AxiosInstance): void {
    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        // Could add logging here if needed
        // console.log(`HTTP ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        // Could add logging here if needed
        // console.log(`HTTP ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        // Could add error logging here if needed
        return Promise.reject(error);
      }
    );
  }

  /**
   * Perform GET request
   */
  static async get<T = any>(
    url: string,
    config?: AxiosRequestConfig & { httpConfig?: HttpConfig }
  ): Promise<T> {
    const client = this.createClient(config?.httpConfig || {});
    const response = await client.get<T>(url, config);
    return response.data;
  }

  /**
   * Perform POST request
   */
  static async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { httpConfig?: HttpConfig }
  ): Promise<T> {
    const client = this.createClient(config?.httpConfig || {});
    const response = await client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Perform PUT request
   */
  static async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { httpConfig?: HttpConfig }
  ): Promise<T> {
    const client = this.createClient(config?.httpConfig || {});
    const response = await client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Perform PATCH request
   */
  static async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { httpConfig?: HttpConfig }
  ): Promise<T> {
    const client = this.createClient(config?.httpConfig || {});
    const response = await client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Perform DELETE request
   */
  static async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig & { httpConfig?: HttpConfig }
  ): Promise<T> {
    const client = this.createClient(config?.httpConfig || {});
    const response = await client.delete<T>(url, config);
    return response.data;
  }

  /**
   * Perform HEAD request
   */
  static async head(
    url: string,
    config?: AxiosRequestConfig & { httpConfig?: HttpConfig }
  ): Promise<AxiosResponse> {
    const client = this.createClient(config?.httpConfig || {});
    return client.head(url, config);
  }

  /**
   * Download file as buffer
   */
  static async downloadFile(
    url: string,
    config?: AxiosRequestConfig & { httpConfig?: HttpConfig }
  ): Promise<Buffer> {
    const client = this.createClient(config?.httpConfig || {});
    const response = await client.get(url, {
      ...config,
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  /**
   * Check if URL is reachable (returns true/false)
   */
  static async isReachable(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      await this.head(url, {
        httpConfig: { timeout, retries: 0 },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Simplified request with automatic retry
   */
  static async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    options: {
      data?: any;
      params?: Record<string, any>;
      headers?: Record<string, string>;
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<T> {
    const { data, params, headers, timeout, retries } = options;

    const config: AxiosRequestConfig & { httpConfig?: HttpConfig } = {
      params,
      headers,
      httpConfig: {
        timeout,
        retries,
      },
    };

    switch (method) {
      case 'GET':
        return this.get<T>(url, config);
      case 'POST':
        return this.post<T>(url, data, config);
      case 'PUT':
        return this.put<T>(url, data, config);
      case 'PATCH':
        return this.patch<T>(url, data, config);
      case 'DELETE':
        return this.delete<T>(url, config);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }
}
